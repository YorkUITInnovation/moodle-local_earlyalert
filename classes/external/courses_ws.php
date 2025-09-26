<?php

require_once($CFG->libdir . "/externallib.php");

use local_earlyalert\helper;
use local_earlyalert\base;

class local_earlyalert_courses_ws extends external_api {
    /**
     * Returns parameters for get_courses
     * @return external_function_parameters
     */
    public static function get_courses_parameters() {
        return new external_function_parameters([
            'userid' => new external_value(PARAM_INT, 'User id', VALUE_REQUIRED)
        ]);
    }

    /**
     * Returns the list of courses for a user
     * @param int $userid
     * @return array
     */
    public static function get_courses($userid) {
        global $DB;
        $params = self::validate_parameters(self::get_courses_parameters(), ['userid' => $userid]);
        $userid = $params['userid'];
        $courses = [];
        if ($userid) {
            $show_active_only = !empty($CFG->earlyalert_showactivecourses);
            if (!$usercourses = enrol_get_users_courses($userid, ['onlyactive' => $show_active_only])) {
                base::debug_to_console('no course');
            }
            $course_data = helper::get_courses_in_acadyear_by_row($usercourses);
            // Flatten the courses into a simple array of id and fullname
            if (!empty($course_data['rows'])) {
                foreach ($course_data['rows'] as $row) {
                    foreach ($row['courses'] as $course) {
                        $courses[] = [
                            'id' => $course->id,
                            'fullname' => $course->fullname
                        ];
                    }
                }
            }
        }
        return $courses;
    }

    /**
     * Returns structure for get_courses
     * @return external_multiple_structure
     */
    public static function get_courses_returns() {
        return new external_multiple_structure(
            new external_single_structure([
                'id' => new external_value(PARAM_INT, 'Course id'),
                'fullname' => new external_value(PARAM_TEXT, 'Course full name')
            ])
        );
    }
}

