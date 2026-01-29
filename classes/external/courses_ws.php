<?php
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Web service for courses functionality.
 *
 * @package     local_earlyalert
 * @copyright   2024 York University <itinnovation@yorku.ca>
 * @license     https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . "/externallib.php");

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_value;
use core_external\external_single_structure;
use core_external\external_multiple_structure;
use local_earlyalert\helper;
use local_earlyalert\base;

/**
 * Courses web service class.
 */
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

