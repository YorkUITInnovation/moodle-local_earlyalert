<?php

require_once($CFG->libdir . "/externallib.php");
require_once("$CFG->dirroot/config.php");

use local_earlyalert\helper;
use local_earlyalert\base;
class local_earlyalert_course_grades_ws extends external_api
{
    /**
     * Returns users parameters
     * @return external_function_parameters
     **/

    public static function get_course_grades_percent_parameters() {
        return new external_function_parameters(array(
            'id' => new external_value(PARAM_INT, 'Course id', false, -1),
            'grade_letter_id' => new external_value(PARAM_INT, 'Grade letter id', false, -1)));
    }

    /** Returns users
     * @global moodle_database $DB
     * @return array $students
     **/

    public static function get_course_grades_percent($id, $grade_letter_id) {
        // TODO: restrict by grade id if exists
        global $DB;
        $params = self::validate_parameters(self::get_course_grades_percent_parameters(), array('id' => $id, 'grade_letter_id' => $grade_letter_id));
        $mdlGrades = helper::get_moodle_grades_by_course($id);

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
                 $students[$i][$key] = $value;
                 if ($filter_students && $key == 'grade' && (float)$value >= $mdlGradeRanges['min'] && (float)$value <= $mdlGradeRanges['max']){
                     $filter_me_out = false;   // we want to keep this student
                 }
             }
             if ($filter_students && $filter_me_out) {
                 unset($students[$i]);
             }
             $i++;
         }
        return $students;
    }


    /** Get students
     * @return external_single_structure
     **/

    public static function get_course_grades_percent_details() {
        $fields = array(
            'id' => new external_value(PARAM_INT, 'Record id', false),
            'course_id' => new external_value(PARAM_INT, 'Course id', false),
            'first_name' => new external_value(PARAM_TEXT, 'User first name', false),
            'last_name' => new external_value(PARAM_TEXT, 'User last name', false),
            'grade' => new external_value(PARAM_TEXT, 'grade', false),
            'idnumber' => new external_value(PARAM_TEXT, 'idnumber', false),
            'campus' => new external_value(PARAM_TEXT, 'User campus', false),
            'faculty' => new external_value(PARAM_TEXT, 'User faculty', false),
            'major' => new external_value(PARAM_TEXT, 'User major', false)
        );
        return new external_single_structure($fields);
    }

    /** Returns users result value
     *  @return external_description
     **/
    public static function get_course_grades_percent_returns() {
        return new external_multiple_structure(self::get_course_grades_percent_details());
    }

    public static function get_course_student_templates($courseid){
        global $DB;

        $mdlGrades = helper::get_moodle_grades_by_course($courseid);
        //lets cache all possible email templates based off of these students...
        $templateCache = array();
        foreach ($mdlGrades as $student) {
            //check if
            if (!isset($templateCache[$student['campus'] . "_" . $student['faculty'] . "_" . $student['major']])) {
                //get all templates for this campus/faculty/major combo
                if ($campus = $DB->get_record('local_organization_campus', array('shortname' => $student['campus']))) {
                    //campus exists
                }
                if ($faculty = $DB->get_record("local_organization_unit", array('shortname' => $student['faculty'], 'campus_id' => $campus->id))) {
                    //faculty exists
                    if ($facultytemplates = $DB->get_records('local_et_email', array('unit' => $faculty->id, 'active' => 1, 'deleted' => 0))) {
                        //faculty template exists
                        foreach ($facultytemplates as $factemp) {
                            $email = new \local_etemplate\email($factemp->id);
                            $templateCache[] = array(
                                'templateKey' => $student['campus'] . "_" . $student['faculty'],
                                'subject' => $email->get_subject(),
                                'message' => $email->preload_template($courseid)
                            );
                        }
                    }
                }
                if ($department = $DB->get_record("local_organization_dept", array('shortname' => $student['major'], 'unit_id' => $faculty->id))) {
                    // department exists
                    if ($depttemplates = $DB->get_records('local_et_email', array('unit' => $faculty->id . "_" . $department->id, 'active' => 1, 'deleted' => 0))) {
                        //department template exists
                        foreach ($depttemplates as $depttemp) {
                            $email = new \local_etemplate\email($depttemp->id);
                            $templateCache[] = array(
                                'templateKey' => $student['campus'] . "_" . $student['faculty'] . "_" . $student['major'],
                                'subject' => $email->get_subject(),
                                'message' => $email->preload_template($courseid)
                            );
                        }
                    }
                }
            }
        }
        error_log("template cache = " . print_r($templateCache, TRUE));
        return $templateCache;
    }
    /**
     * Returns users parameters
     * @return external_function_parameters
     **/
    public static function get_course_student_templates_parameters() {
        return new external_function_parameters(array(
            'id' => new external_value(PARAM_INT, 'Course id', false, -1)
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
     *  @return external_description
     **/
    public static function get_course_student_templates_returns() {
        return new external_multiple_structure(self::get_course_student_templates_details());
    }
}