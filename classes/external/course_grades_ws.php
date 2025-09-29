<?php

require_once($CFG->libdir . "/externallib.php");
require_once("$CFG->dirroot/config.php");

use local_earlyalert\helper;
use local_earlyalert\base;
use local_etemplate\email;

class local_earlyalert_course_grades_ws extends external_api
{
    public static function get_course_student_templates($id, $alert_type, $teacher_user_id, $grade_letter_id)
    {
        global $DB;


        $params = self::validate_parameters(
            self::get_course_student_templates_parameters(), array(
                'id' => $id,
                'alert_type' => $alert_type,
                'teacher_user_id' => $teacher_user_id,
                'grade_letter_id' => $grade_letter_id
            )
        );

        $courseid = $id;
        //raise_memory_limit(MEMORY_UNLIMITED);
        try {
            // Convert alert type to int based on constants in email class
            switch ($alert_type) {
                case 'grade':
                    $message_type = email::MESSAGE_TYPE_GRADE;
                    break;
                case 'assign':
                    $message_type = email::MESSAGE_TYPE_ASSIGNMENT;
                    break;
                case 'exam':
                    $message_type = email::MESSAGE_TYPE_EXAM;
                    break;
            }

            // Get course idnumber to get faculty course name and course number
            $course = $DB->get_record('course', array('id' => $courseid), 'idnumber');
            // Convert course idnumber to array by _
            $course_idnumber = explode('_', $course->idnumber);
            // Capture faculty, course name and course number
            $course_name = $course_idnumber[2];
            $course_number = $course_idnumber[4];
            // disable section for now
            //$section = $course_idnumber[7];

            // Get students with grades for this course
            $mdlGrades = helper::get_moodle_grades_by_course($courseid);
            unset($mdlGrades[$teacher_user_id]);

            // For grade_letter_id <= 0 (e.g., -1) we do not filter by grade at all.
            $grade_range = null;
            if ($grade_letter_id > 0) {
                $grade_range = helper::get_moodle_grade_percent_range($grade_letter_id);
            }

            //lets cache all possible email templates based off of these students...
            $templateCache = array();
            $i = 1;

            foreach ($mdlGrades as $student) {
                // Apply grade filtering only when a valid grade range is present
                $include_student = true;

                if (!is_null($grade_range) && !empty($grade_range)) {
                    $student_grade = $student['grade'];

                    // Skip students with non-numeric grades (No Grade, N/A)
                    if (!is_numeric($student_grade)) {
                        $include_student = false;
                    } else {
                        $grade_value = (float)$student_grade;
                        // Check if student's grade falls within the selected letter grade range
                        $include_student =  $grade_value <= $grade_range['max']; // include them if its less than or equal to max grade selected
                    }
                }

                if (!$include_student) {
                    continue;
                }

                // Get student record
                $student_record = $DB->get_record('user', array('idnumber' => $student['idnumber']));
                // Get student Language
                $lang = self::process_lang_for_templates($student['lang']);

                $student_idnumber = $student['idnumber'];

                $campus = trim($student['campus']);
                $faculty = trim($student['faculty']);
                $department = trim($student['major']);

                $template = null;
                $templateKey = $student_idnumber;

                $sql = "
                        SELECT *, 
                            CASE
                                WHEN campus = ? AND faculty = ? AND department = ? AND course = ? AND coursenumber = ? AND message_type = ? AND lang = ? THEN 1
                                WHEN campus = ? AND faculty = ? AND (department IS NULL OR department = '') AND course = ? AND coursenumber = ? AND message_type = ? AND lang = ? THEN 2
                                WHEN campus = ? AND (faculty IS NULL OR faculty = '') AND (department IS NULL OR department = '') AND course = ? AND coursenumber = ? AND message_type = ? AND lang = ? THEN 3
                                WHEN (campus IS NULL OR campus = '') AND faculty = ? AND (department IS NULL OR department = '') AND course = ? AND coursenumber = ? AND message_type = ? AND lang = ? THEN 4
                                WHEN campus = ? AND faculty = ? AND department = ? AND (course IS NULL OR course = '') AND (coursenumber IS NULL OR coursenumber = '') AND message_type = ? AND lang = ? THEN 5
                                WHEN campus = ? AND faculty = ? AND (department IS NULL OR department = '') AND (course IS NULL OR course = '') AND (coursenumber IS NULL OR coursenumber = '') AND message_type = ? AND lang = ? THEN 6
                                WHEN campus = ? AND (faculty IS NULL OR faculty = '') AND (department IS NULL OR department = '') AND (course IS NULL OR course = '') AND (coursenumber IS NULL OR coursenumber = '') AND message_type = ? AND lang = ? THEN 7
                                WHEN (campus IS NULL OR campus = '') AND faculty = ? AND (department IS NULL OR department = '') AND (course IS NULL OR course = '') AND (coursenumber IS NULL OR coursenumber = '') AND message_type = ? AND lang = ? THEN 8
                                ELSE 9
                            END AS priority
                        FROM {local_et_email}
                        WHERE active = 1 AND deleted = 0
                        ORDER BY priority ASC
                        Limit 1
                        ";


                $search_params = [
                    // CASE condition 1
                    $campus, $faculty, $department, $course_name, $course_number, $message_type, $lang,
                    // CASE condition 2
                    $campus, $faculty, $course_name, $course_number, $message_type, $lang,
                    // CASE condition 3
                    $campus, $course_name, $course_number, $message_type, $lang,
                    // CASE condition 4
                    $faculty, $course_name, $course_number, $message_type, $lang,
                    // CASE condition 5
                    $campus, $faculty, $department, $message_type, $lang,
                    // CASE condition 6
                    $campus, $faculty, $message_type, $lang,
                    // CASE condition 7
                    $campus,  $message_type, $lang,
                    // CASE condition 8
                    $faculty, $message_type, $lang,
                ];

                $template = $DB->get_record_sql($sql, $search_params);

                if ($template) {
                    $email = new \local_etemplate\email($template->id);
                    $template_data = $email->preload_template($courseid, $student_record, $teacher_user_id);

                    // Merge student data with template data
                    $student_and_template_data = array_merge($student, [
                        'templateKey' => $templateKey,
                        'subject' => $template_data->subject,
                        'message' => $template_data->message,
                        'templateid' => $template_data->templateid,
                        'revision_id' => $template_data->revision_id,
                        'course_id' => $courseid,
                        'hascustommessage' => isset($template->hascustommessage) ? (int)$template->hascustommessage : 0,
                        'instructor_id' => $template_data->instructor_id,
                        'triggered_from_user_id' => $template_data->triggered_from_user_id
                    ]);

                    $templateCache[$templateKey] = $student_and_template_data;

                } else {
                    error_log("No template found for student: " . $student['idnumber'] . "| Course: " . $courseid . "| Campus: " . $student['campus'] . "| Faculty: " . $student['faculty'] . "| Major: " . $student['major']);
                }
            }

            return $templateCache;
        } catch (Exception $e) {
            error_log('Error in get_course_student_templates: ' . $e->getMessage());
            throw new moodle_exception('errorprocessingrequest', 'local_earlyalert', '', null, $e->getMessage());
        }
    }

    private static function process_lang_for_templates($lang): string
    {
        $lang = strtoupper($lang);
        // Business rule in webservice! If student does not have a language in English or French, default to English
        // Array of allowed languages (ISO 639-1 codes and variations)
        $allowed_en_languages = ['EN', 'EN-CA', 'EN-US'];
        $allowed_fr_languages = ['FR', 'FR-CA', 'FR-FR'];
        if (in_array($lang, $allowed_en_languages)) {
            $lang = 'EN';
        } else if (in_array($lang, $allowed_fr_languages)) {
            $lang = 'FR';
        } else { // any other language
            $lang = 'EN';
        }
        return $lang;
    }
    /**
     * Returns users parameters
     * @return external_function_parameters
     **/
    public static function get_course_student_templates_parameters()
    {
        return new external_function_parameters(array(
            'id' => new external_value(PARAM_INT, 'Course id', VALUE_DEFAULT, 0),
            'alert_type' => new external_value(PARAM_TEXT, 'Alert type; grade, assign, exam', VALUE_DEFAULT, 'grade'),
            'teacher_user_id' => new external_value(PARAM_INT, 'User id of teacher', VALUE_DEFAULT, 0),
            'grade_letter_id' => new external_value(PARAM_INT, 'Grade letter id', VALUE_DEFAULT, -1)
        ));
    }

    /** Get students
     * @return external_single_structure
     **/

    public static function get_course_student_templates_details()
    {
        $fields = array(
            'id' => new external_value(PARAM_INT, 'Student id', false),
            'course_id' => new external_value(PARAM_INT, 'Course id', false),
            'first_name' => new external_value(PARAM_TEXT, 'User first name', false),
            'last_name' => new external_value(PARAM_TEXT, 'User last name', false),
            'grade' => new external_value(PARAM_TEXT, 'grade', false),
            'lang' => new external_value(PARAM_TEXT, 'lang', false),
            'idnumber' => new external_value(PARAM_TEXT, 'idnumber', false),
            'campus' => new external_value(PARAM_TEXT, 'User campus', false),
            'faculty' => new external_value(PARAM_TEXT, 'User faculty', false),
            'major' => new external_value(PARAM_TEXT, 'User major', false),
            'templateKey' => new external_value(PARAM_RAW, 'Campus_Faculty_Major key for templates', false),
            'subject' => new external_value(PARAM_RAW, 'Subject for template message', false),
            'message' => new external_value(PARAM_RAW, 'Message text for template', false),
            'templateid' => new external_value(PARAM_RAW, 'Template ID', false),
            'revision_id' => new external_value(PARAM_RAW, 'Template Revision', false),
            'hascustommessage' => new external_value(PARAM_RAW, 'Template has custom message', false),
            'instructor_id' => new external_value(PARAM_RAW, 'Template Instructor ID', false),
            'triggered_from_user_id' => new external_value(PARAM_RAW, 'Template Date', false)
        );
        return new external_single_structure($fields);
    }

    /** Returns users result value
     * @return external_description
     **/
    public static function get_course_student_templates_returns()
    {
        return new external_multiple_structure(self::get_course_student_templates_details());
    }
}
