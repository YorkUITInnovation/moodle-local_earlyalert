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
                'id' => new external_value(PARAM_INT, 'Course id', VALUE_OPTIONAL, -1),
                'grade_letter_id' => new external_value(PARAM_INT, 'Grade letter id', VALUE_OPTIONAL, -1),
                'teacher_user_id' => new external_value(PARAM_INT, 'User id of teacher', VALUE_OPTIONAL, -1),
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
        //raise_memory_limit(MEMORY_UNLIMITED);

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

            $teacher = $DB->get_record('user', array('id' => $teacher_user_id), 'id,firstname,lastname,email');

            $students = [];
            $i = 0;
            $filter_students = false;
            $filter_me_out = false;

            foreach ($mdlStudents as $student) {
                foreach ($student as $key => $value) {
                    $students[$i]['teacher_firstname'] = $teacher->firstname;
                    $students[$i]['teacher_lastname'] = $teacher->lastname;
                    $students[$i]['teacher_email'] = $teacher->email;

                    if ($key === 'id') {
                        $table_exists = $DB->get_manager()->table_exists('svadata');
                        if ($table_exists) {
                            $sql = "SELECT
                                sva.faculty,
                                sva.campus,
                                sva.academicyear
                            FROM
                                {svadata} sva
                            INNER JOIN
                                {user} u ON sva.sisid = u.idnumber
                            WHERE
                                u.id = :userid";
                            $sva_data = $DB->get_record_sql($sql, array('userid' => $value));
                        }
                        else {
                            // Mock data in case the table doesn't exist
                            $sva_data = (object) [
                                'faculty' => 'Mock Faculty',
                                'campus' => 'Mock Campus',
                                'academicyear' => 'Mock Academic Year'
                            ];
                        }
                        $students[$i]['faculty'] = $sva_data->faculty;
                        $students[$i]['campus'] = $sva_data->campus;
                    }

                    if ($key != 'faculty' && $key != 'campus') {
                        $students[$i][$key] = $value;
                    }
                }
                $i++;
            }

            //raise_memory_limit(MEMORY_STANDARD);
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

    public static function get_course_student_templates($courseid, $alert_type, $teacher_user_id)
    {
        global $DB;
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
                default:
                    $alert_type = email::MESSAGE_TYPE_CATCHALL;
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
                if ($sva_data = $DB->get_record('svadata', array('sisid' => $student['idnumber']))) {
                    $student['faculty'] = $sva_data->faculty;
                    $student['campus'] = $sva_data->campus;
                }
                $student_record = $DB->get_record('user', array('idnumber' => $student['idnumber']));
                // Get student Language
                $lang = $student_record->lang;

                $course_template = $DB->get_record('local_et_email',
                    array('lang' => $lang,
                        'faculty' => $course_faculty,
                        'course' => $course_name,
                        'coursenumber' => $course_number,
                        'message_type' => $alert_type,
                        'active' => 1,
                        'deleted' => 0)
                );

                if ($course_template->faculty == $student['faculty']) {
                    if (!isset($templateCache['course_' . $courseid])) {
                        $email = new \local_etemplate\email($course_template->id);
                        $template_data = $email->preload_template($courseid, $student_record, $teacher_user_id);
                        $templateCache['course_' . $courseid] = array(
                            'templateKey' => 'course_' . $courseid,
                            'subject' => $template_data->subject,
                            'message' => $template_data->message,
                            'templateid' => $template_data->templateid,
                            'revision_id' => $template_data->revision_id,
                            'course_id' => $courseid,
                            'instructor_id' => $template_data->instructor_id,
                            'triggered_from_user_id' => $template_data->triggered_from_user_id
                        );
                    }
                } else {
                    //check if template is already defined
                    if (
                        !isset($templateCache[$student['campus'] . "_" . $student['faculty'] . "_" . $student['major']]) ||
                        !isset($templateCache[$student['campus'] . "_" . $student['faculty']]) ||
                        !isset($templateCache[$student['campus']])
                    ) {
                        // Set up campus, faculty and department
                        $campus = $DB->get_record('local_organization_campus', array('shortname' => $student['campus']));
                        $faculty = $DB->get_record("local_organization_unit", array('shortname' => trim($student['faculty']), 'campus_id' => $campus->id));
                        $department = $DB->get_record("local_organization_dept", array('shortname' => $student['major'], 'unit_id' => $faculty->id));

                        $campustemplate = false;
                        $facultytemplate = false;
                        $depttemplate = false;
                        // Get various email templates
                        $campustemplate = $DB->get_record('local_et_email',
                            array('lang' => $lang, 'unit' => $campus->id, 'context' => 'CAMPUS', 'message_type' => $alert_type, 'active' => 1, 'deleted' => 0));
                        $facultytemplate = $DB->get_record('local_et_email',
                            array('lang' => $lang, 'unit' => $faculty->id, 'context' => 'UNIT', 'message_type' => $alert_type, 'active' => 1, 'deleted' => 0));
                        $depttemplate = $DB->get_record('local_et_email',
                            array('lang' => $lang, 'unit' => $department->id, 'context' => 'DEPT', 'message_type' => $alert_type, 'active' => 1, 'deleted' => 0));

                        // Check which of the aboves are true;
                        $templateKey = [];
                        $template = false;
                        if ($campustemplate) {
                            $templateKey[$i] = $student['campus'];
                            $template[$i] = $campustemplate;
                        }
                        if ($facultytemplate) {
                            $templateKey[$i] = $student['campus'] . "_" . $student['faculty'];
                            $template[$i] = $facultytemplate;
                        }
                        if ($depttemplate) {
                            $templateKey[$i] = $student['campus'] . "_" . $student['faculty'] . "_" . $student['major'];
                            $template[$i] = $depttemplate;
                        }

                        if (!empty($templateKey)) {
                            $email = new \local_etemplate\email($template[$i]->id);
                            $template_data = $email->preload_template($courseid, $student_record, $teacher_user_id);
                            $templateCache[$templateKey[$i]] = array(
                                'templateKey' => $templateKey[$i],
                                'subject' => $template_data->subject,
                                'message' => $template_data->message,
                                'templateid' => $template_data->templateid,
                                'revision_id' => $template_data->revision_id,
                                'course_id' => $courseid,
                                'instructor_id' => $template_data->instructor_id,
                                'triggered_from_user_id' => $template_data->triggered_from_user_id
                            );
                        }
                    }
                }
                $i++;
            }
        //raise_memory_limit(MEMORY_STANDARD);
        return $templateCache;
        }
        catch (Exception $e) {
            error_log('Error in get_course_student_templates: ' . $e->getMessage());
            throw new moodle_exception('errorprocessingrequest', 'local_earlyalert', '', null, $e->getMessage());
        }
    }

    /**
     * Returns users parameters
     * @return external_function_parameters
     **/
    public static function get_course_student_templates_parameters()
    {
        return new external_function_parameters(array(
            'id' => new external_value(PARAM_INT, 'Course id', VALUE_OPTIONAL, -1),
            'alert_type' => new external_value(PARAM_TEXT, 'Alert type; grade, assign, exam', VALUE_OPTIONAL, 'grade'),
            'teacher_user_id' => new external_value(PARAM_INT, 'User id of teacher', VALUE_OPTIONAL, 0)
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