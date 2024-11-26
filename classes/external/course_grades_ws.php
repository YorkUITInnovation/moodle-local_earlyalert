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
        // TODO: restrict by grade id if exists
        global $DB;
        $params = self::validate_parameters(
            self::get_course_grades_percent_parameters(), array(
                'id' => $id,
                'grade_letter_id' => $grade_letter_id,
                'teacher_user_id' => $teacher_user_id
            )
        );
        $mdlGrades = helper::get_moodle_grades_by_course($id);

        $teacher = $DB->get_record('user', array('id' => $teacher_user_id), 'id,firstname,lastname,email');
        file_put_contents('/var/www/moodledata/temp/teacher.txt', print_r($teacher, TRUE));

        $students = [];
        $i = 0;
        $filter_students = false;
        $filter_me_out = false;

        if ($grade_letter_id > 0) {
            // get grade ranges and filter students
            $mdlGradeRanges = helper::get_moodle_grade_percent_range($grade_letter_id);
            $filter_students = true;
            $filter_me_out = true;
        }
        foreach ($mdlGrades as $grade) {
            foreach ($grade as $key => $value) { // only those filtered

                $students[$i]['teacher_firstname'] = $teacher->firstname;
                $students[$i]['teacher_lastname'] = $teacher->lastname;
                $students[$i]['teacher_email'] = $teacher->email;

                if ($key === 'id') {
                    // Get faculty and campus from svadata table
                    $sql = "Select
                            sva.faculty,
                            sva.campus,
                            sva.academicyear
                        From
                            moodle.mdl_svadata sva Inner Join
                            moodle.mdl_user u On sva.sisid = u.idnumber
                        Where
                            u.id =" . $value;
                    $sva_data = $DB->get_record_sql($sql);
                    $students[$i]['faculty'] = $sva_data->faculty;
                    $students[$i]['campus'] = $sva_data->campus;
                }

                // Remove the faculty key from the array
                if ($key == 'faculty' || $key == 'campus') {
                    // Do noting
                } else {
                    $students[$i][$key] = $value;
                }

                if ($filter_students && $key == 'grade' && (float)$value >= $mdlGradeRanges['min'] && (float)$value <= $mdlGradeRanges['max']) {
                    $filter_me_out = false;   // we want to keep this student
                }
            }
            if ($filter_students && $filter_me_out) {
                unset($students[$i]);
            }
            $i++;
        }
        file_put_contents('/var/www/moodledata/temp/students.txt', print_r($students, TRUE));
        return $students;
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

        $facultytemplates = '';
        $depttemplates = '';

        $mdlGrades = helper::get_moodle_grades_by_course($courseid);
        //lets cache all possible email templates based off of these students...
        $i = 0;
        $templateCache = array();
        foreach ($mdlGrades as $student) {
            if ($sva_data = $DB->get_record('svadata', array('sisid' => $student['idnumber']))) {
                $student['faculty'] = $sva_data->faculty;
                $student['campus'] = $sva_data->campus;
            }
            $student_record = $DB->get_record('user', array('idnumber' => $student['idnumber']));

            //check if template is already defined
            if (!isset($templateCache[$student['campus'] . "_" . $student['faculty'] . "_" . $student['major']]) || !isset($templateCache[$student['campus'] . "_" . $student['faculty']])) {
                //get all templates for this campus/faculty/major combo
                if ($campus = $DB->get_record('local_organization_campus', array('shortname' => $student['campus']))) {
                    //campus exists
                }

                if ($faculty = $DB->get_record("local_organization_unit", array('shortname' => trim($student['faculty']), 'campus_id' => $campus->id))) {

                    // faculty exists
                    // Now check to see if an email template exists based on the unit, active, deleted and alert_type

                    if ($facultytemplates = $DB->get_records('local_et_email',
                        array('unit' => $faculty->id, 'message_type' => $alert_type, 'active' => 1, 'deleted' => 0,))) {
                        //faculty template exists
                        foreach ($facultytemplates as $factemp) {
                            $email = new \local_etemplate\email($factemp->id);
                            $template_data = $email->preload_template($courseid, $student_record, $teacher_user_id);
                            file_put_contents('/var/www/moodledata/temp/template_data' . $i . '.txt', print_r($template_data, TRUE));
                            $templateCache[] = array(
                                'templateKey' => $student['campus'] . "_" . $student['faculty'],
                                'subject' => $template_data->subject,
                                'message' => $template_data->message,
                                'templateid' => $template_data->templateid,
                                'revision_id' => $template_data->revision_id,
                                'body' => $template_data->body,
                                'course_id' => $template_data->course_id,
                                'instructor_id' => $template_data->instructor_id,
                                'date_message_sent' => $template_data->date_message_sent,
                                'timecreated' => $template_data->timecreated,
                                'timemodified' => $template_data->timemodified
                            );
                        }
                    } else {
                        if ($catchalltemplates = $DB->get_records('local_et_email',
                            array('unit' => $faculty->id, 'message_type' => email::MESSAGE_TYPE_CATCHALL, 'active' => 1, 'deleted' => 0))) {
                            //catchall template exists
                            foreach ($catchalltemplates as $catchalltemp) {
                                $email = new \local_etemplate\email($catchalltemp->id);
                                $template_data = $email->preload_template($courseid, $student_record, $teacher_user_id);
                                $templateCache[] = array(
                                    'templateKey' => $student['campus'] . "_" . $student['faculty'],
                                    'subject' => $template_data->subject,
                                    'message' => $template_data->message,
                                    'templateid' => $template_data->templateid,
                                    'revision_id' => $template_data->revision_id,
                                    'body' => $template_data->body,
                                    'course_id' => $template_data->course_id,
                                    'instructor_id' => $template_data->instructor_id,
                                    'date_message_sent' => $template_data->date_message_sent,
                                    'timecreated' => $template_data->timecreated,
                                    'timemodified' => $template_data->timemodified
                                );
                            }
                        }
                    }
                }
                if ($department = $DB->get_record("local_organization_dept", array('shortname' => $student['major'], 'unit_id' => $faculty->id))) {
                    // department exists
                    if ($depttemplates = $DB->get_records('local_et_email',
                        array('unit' => $faculty->id . "_" . $department->id, 'message_type' => $alert_type, 'active' => 1, 'deleted' => 0))) {
                        //department template exists
                        foreach ($depttemplates as $depttemp) {
                            $email = new \local_etemplate\email($depttemp->id);
                            $template_data = $email->preload_template($courseid, $student_record, $teacher_user_id);
                            $templateCache[] = array(
                                'templateKey' => $student['campus'] . "_" . $student['faculty']. "_" . $student['major'],
                                'subject' => $template_data->subject,
                                'message' => $template_data->message,
                                'templateid' => $template_data->templateid,
                                'revision_id' => $template_data->revision_id,
                                'body' => $template_data->body,
                                'course_id' => $template_data->course_id,
                                'instructor_id' => $template_data->instructor_id,
                                'date_message_sent' => $template_data->date_message_sent,
                                'timecreated' => $template_data->timecreated,
                                'timemodified' => $template_data->timemodified
                            );
                        }
                    } else {
                        if ($catchalltemplates = $DB->get_records('local_et_email',
                            array('unit' => $faculty->id . "_" . $department->id, 'message_type' => email::MESSAGE_TYPE_CATCHALL, 'active' => 1, 'deleted' => 0))) {
                            //catchall template exists
                            foreach ($catchalltemplates as $catchalltemp) {
                                $email = new \local_etemplate\email($catchalltemp->id);
                                $template_data = $email->preload_template($courseid, $student_record, $teacher_user_id);
                                $templateCache[] = array(
                                    'templateKey' => $student['campus'] . "_" . $student['faculty']. "_" . $student['major'],
                                    'subject' => $template_data->subject,
                                    'message' => $template_data->message,
                                    'templateid' => $template_data->templateid,
                                    'revision_id' => $template_data->revision_id,
                                    'body' => $template_data->body,
                                    'course_id' => $template_data->course_id,
                                    'instructor_id' => $template_data->instructor_id,
                                    'date_message_sent' => $template_data->date_message_sent,
                                    'timecreated' => $template_data->timecreated,
                                    'timemodified' => $template_data->timemodified
                                );
                            }
                        }
                    }
                }
                $i++;
            }
        }
        error_log("returning templatecache :" . print_r($templateCache, TRUE));
        return $templateCache;
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
            'message' => new external_value(PARAM_RAW, 'Message text for template', false)
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