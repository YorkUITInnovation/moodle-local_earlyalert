<?php

require_once($CFG->libdir . "/externallib.php");
require_once("$CFG->dirroot/config.php");

use local_earlyalert\helper;
use local_earlyalert\base;
use local_etemplate\email;

class local_earlyalert_course_grades_ws extends external_api
{
    /**
     * Returns users parameters
     * @return external_function_parameters
     **/

    public static function get_course_grades_percent_parameters()
    {
        return new external_function_parameters(array(
                'id' => new external_value(PARAM_INT, 'Course id', VALUE_DEFAULT, -1),
                'grade_letter_id' => new external_value(PARAM_INT, 'Grade letter id', VALUE_DEFAULT, -1),
                'teacher_user_id' => new external_value(PARAM_INT, 'User id of teacher', VALUE_DEFAULT, -1),
            )
        );
    }

    /** Returns users
     * @return array $students
     **@global moodle_database $DB
     */

    public static function get_course_grades_percent($id, $grade_letter_id, $teacher_user_id)
    {
        global $DB;

        try {
            $params = self::validate_parameters(
                self::get_course_grades_percent_parameters(), array(
                    'id' => $id,
                    'grade_letter_id' => $grade_letter_id,
                    'teacher_user_id' => $teacher_user_id
                )
            );

            $mdlStudents = helper::get_moodle_grades_by_course($id);
            unset($mdlStudents[$teacher_user_id]);

            // For grade_letter_id <= 0 (e.g., -1) we do not filter by grade at all.
            $grade_range = null;
            if ($grade_letter_id > 0) {
                $grade_range = helper::get_moodle_grade_percent_range($grade_letter_id);
            }

            $teacher = $DB->get_record('user', array('id' => $teacher_user_id), 'id,firstname,lastname,email');

            $students = [];
            $i = 0;

            foreach ($mdlStudents as $student) {
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
                        // $include_student = ($grade_value >= $grade_range['min'] && $grade_value <= $grade_range['max']);
                        $include_student =  $grade_value <= $grade_range['max']; // include them if its less than or equal to max grade selected
                    }
                }

                if ($include_student) {
                    foreach ($student as $key => $value) {
                        $students[$i]['teacher_firstname'] = $teacher->firstname;
                        $students[$i]['teacher_lastname'] = $teacher->lastname;
                        $students[$i]['teacher_email'] = $teacher->email;
                        if ($key == 'lang') {
                            $students[$i]['lang'] = self::process_lang_for_templates($value);
                        }
                        else $students[$i][$key] = $value;
                    }
                    $i++;
                }
            }
            usort($students, function($a, $b) {
                return strcmp($a['last_name'], $b['last_name']);
            });
            return $students;

        } catch (Exception $e) { //error log
            error_log('Error in get_course_grades_percent: ' . $e->getMessage());
            throw new moodle_exception('errorprocessingrequest', 'local_earlyalert', '', null, $e->getMessage());
        }
    }


    /** Get students
     * @return external_single_structure
     **/

    public static function get_course_grades_percent_details()
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
            'teacher_firstname' => new external_value(PARAM_TEXT, 'Teacher First name', false),
            'teacher_lastname' => new external_value(PARAM_TEXT, 'Teacher Last name', false),
            'teacher_email' => new external_value(PARAM_TEXT, 'Teacher email', false),
        );
        return new external_single_structure($fields);
    }

    /** Returns users result value
     * @return external_description
     **/
    public static function get_course_grades_percent_returns()
    {
        return new external_multiple_structure(self::get_course_grades_percent_details());
    }

    public static function get_course_student_templates($id, $alert_type, $teacher_user_id)
    {
        global $DB;


        $params = self::validate_parameters(
            self::get_course_student_templates_parameters(), array(
                'id' => $id,
                'alert_type' => $alert_type,
                'teacher_user_id' => $teacher_user_id
            )
        );

        $courseid = $id;
        //raise_memory_limit(MEMORY_UNLIMITED);
        try {
            // Convert alert type to int based on constants in email class
            switch ($alert_type) {
                case 'grade':
                    $alert_type = email::MESSAGE_TYPE_GRADE;
                    break;
                case 'assign':
                    $alert_type = email::MESSAGE_TYPE_ASSIGNMENT;
                    break;
                case 'exam':
                    $alert_type = email::MESSAGE_TYPE_EXAM;
                    break;
            }
            // Get teacher
            $teacher = $DB->get_record('user', array('id' => $teacher_user_id), 'firstname,lastname,email');

            // Get course idnumber to get faculty course name and course number
            $course = $DB->get_record('course', array('id' => $courseid), 'idnumber');
            // Convert course idnumber to array by _
            $course_idnumber = explode('_', $course->idnumber);
            // Capture faculty, course name and course number
            $course_faculty = $course_idnumber[1];
            $course_name = $course_idnumber[2];
            $course_number = $course_idnumber[4];
            // Get course email template

            $facultytemplates = '';
            $depttemplates = '';


            $mdlGrades = helper::get_moodle_grades_by_course($courseid);
            unset($mdlGrades[$teacher_user_id]);

            //lets cache all possible email templates based off of these students...
            $templateCache = array();
            $i = 1;

            foreach ($mdlGrades as $student) {
                // Get student record
                $student_record = $DB->get_record('user', array('idnumber' => $student['idnumber']));
                // Get student Language
                $lang = self::process_lang_for_templates($student['lang']);

                $student_idnumber = $student['idnumber'];

                $template = null;
                $templateKey = '';

                // 1. Check for the most specific template: campus_course
                $campus_course_params = [
                    'lang' => $lang,
                    'campus' => $student['campus'],
                    'faculty' => $course_faculty,
                    'course' => $course_name,
                    'coursenumber' => $course_number,
                    'template_type' => \local_etemplate\email::TEMPLATE_TYPE_CAMPUS_COURSE,
                    'message_type' => $alert_type,
                    'active' => 1,
                    'deleted' => 0
                ];
                $template = $DB->get_record('local_et_email', $campus_course_params);
                if ($template) {
                    $templateKey = $student['campus'] . '_course_' . $courseid . '_' . $lang . '_' . $student_idnumber;
                }

                // 2. If not found, check for faculty_course template
                if (!$template) {
                    $faculty_course_params = [
                        'lang' => $lang,
                        'faculty' => $course_faculty,
                        'course' => $course_name,
                        'coursenumber' => $course_number,
                        'template_type' => \local_etemplate\email::TEMPLATE_TYPE_FACULTY_COURSE,
                        'message_type' => $alert_type,
                        'active' => 1,
                        'deleted' => 0
                    ];
                    $template = $DB->get_record('local_et_email', $faculty_course_params);
                    if ($template) {
                        $templateKey = 'course_' . $courseid . '_' . $lang . '_' . $student_idnumber;
                    }
                }

                // 3. If still not found, check for department, faculty, and campus level templates
                if (!$template) {
                    $campus = $DB->get_record('local_organization_campus', array('shortname' => $student['campus']));
                    $faculty = $DB->get_record("local_organization_unit", array('shortname' => trim($student['faculty']), 'campus_id' => $campus->id));
                    $department = $DB->get_record("local_organization_dept", array('shortname' => $student['major'], 'unit_id' => $faculty->id));

                    // Check for department template
                    if ($department) {
                        $depttemplate = $DB->get_record('local_et_email',
                            ['lang' => $lang, 'unit' => $department->id, 'context' => 'DEPT', 'message_type' => $alert_type, 'active' => 1, 'deleted' => 0, 'template_type' => \local_etemplate\email::TEMPLATE_TYPE_CAMPUS_FACULTY]);
                        if ($depttemplate) {
                            $template = $depttemplate;
                            $templateKey = $student['campus'] . "_" . $student['faculty'] . "_" . $student['major'] . '_' . $lang . '_' . $student_idnumber;
                        }
                    }

                    // Check for faculty template if department template not found
                    if (!$template && $faculty) {
                        $facultytemplate = $DB->get_record('local_et_email',
                            ['lang' => $lang, 'unit' => $faculty->id, 'context' => 'UNIT', 'message_type' => $alert_type, 'active' => 1, 'deleted' => 0, 'template_type' => \local_etemplate\email::TEMPLATE_TYPE_CAMPUS_FACULTY]);
                        if ($facultytemplate) {
                            $template = $facultytemplate;
                            $templateKey = $student['campus'] . "_" . $student['faculty'] . '_' . $lang . '_' . $student_idnumber;
                        }
                    }

                    // Check for campus template if others not found
                    if (!$template && $campus) {
                        $campustemplate = $DB->get_record('local_et_email',
                            ['lang' => $lang, 'unit' => $campus->id, 'context' => 'CAMPUS', 'message_type' => $alert_type, 'active' => 1, 'deleted' => 0, 'template_type' => \local_etemplate\email::TEMPLATE_TYPE_CAMPUS_FACULTY]);
                        if ($campustemplate) {
                            $template = $campustemplate;
                            $templateKey = $student['campus'] . '_' . $lang . '_' . $student_idnumber;
                        }
                    }
                }

                if ($template) {
                    $email = new \local_etemplate\email($template->id);
                    $template_data = $email->preload_template($courseid, $student_record, $teacher_user_id);
                    $templateCache[$templateKey] = array(
                        'templateKey' => $templateKey,
                        'subject' => $template_data->subject,
                        'message' => $template_data->message,
                        'templateid' => $template_data->templateid,
                        'revision_id' => $template_data->revision_id,
                        'course_id' => $courseid,
                        'hascustommessage' => isset($template->hascustommessage) ? (int)$template->hascustommessage : 0,
                        'instructor_id' => $template_data->instructor_id,
                        'triggered_from_user_id' => $template_data->triggered_from_user_id
                    );
                } else {
                    error_log("No template found for student: " . $student['idnumber'] . "| Course: " . $courseid . "| Campus: " . $student['campus'] . "| Faculty: " . $student['faculty'] . "| Major: " . $student['major']);
                }
            }
            //raise_memory_limit(MEMORY_STANDARD);

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
            'teacher_user_id' => new external_value(PARAM_INT, 'User id of teacher', VALUE_DEFAULT, 0)
        ));
    }

    /** Get students
     * @return external_single_structure
     **/

    public static function get_course_student_templates_details()
    {
        $fields = array(
            'templateKey' => new external_value(PARAM_RAW, 'Campus_Faculty_Major key for templates', false),
            'subject' => new external_value(PARAM_RAW, 'Subject for template message', false),
            'message' => new external_value(PARAM_RAW, 'Message text for template', false),
            'templateid' => new external_value(PARAM_RAW, 'Template ID', false),
            'revision_id' => new external_value(PARAM_RAW, 'Template Revision', false),
            'course_id' => new external_value(PARAM_RAW, 'Template Course ID', false),
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
