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
        return new external_function_parameters(array('id' => new external_value(PARAM_INT, 'Course id', false, -1), 'grade_id' => new external_value(PARAM_TEXT, 'Grade letter id', false, 11)));
    }

    /** Returns users
     * @global moodle_database $DB
     * @return array users
     **/

    public static function get_course_grades_percent($id, $grade_id) {
        // TODO: restrict by grade id if exists
        global $DB;
        $params = self::validate_parameters(self::get_course_grades_percent_parameters(), array('id' => $id, 'grade_id' => $grade_id));
        $mdlGrades = helper::get_moodle_grades_by_course($id);
        $users = [];
        $i = 0;
        foreach ($mdlGrades as $grade) {
            foreach ($grade as $key => $value) {
                $users[$i][$key] = $value;
            }
            $i++;
        }
        return $users;
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
            'grade' => new external_value(PARAM_TEXT, 'grade', false)
        );
        return new external_single_structure($fields);
    }

    /** Returns users result value
     *  @return external_description
     **/
    public static function get_course_grades_percent_returns() {
        return new external_multiple_structure(self::get_course_grades_percent_details());
    }

}