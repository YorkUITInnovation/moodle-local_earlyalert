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
 * Web service definitions for the Early Alert plugin.
 *
 * @package     local_earlyalert
 * @copyright   2024 York University <itinnovation@yorku.ca>
 * @license     https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$functions = [
    'local_earlyalert_course_student_templates' => [
        'classname' => 'local_earlyalert_course_grades_ws',
        'methodname' => 'get_course_student_templates',
        'classpath' => 'local/earlyalert/classes/external/course_grades_ws.php',
        'description' => 'Return list of email templates for this course',
        'type' => 'read',
        'capabilities' => '',
        'ajax' => true,
    ],
    'local_earlyalert_report_log_insert' => [
        'classname' => 'local_earlyalert_record_log_ws',
        'methodname' => 'insert_email_log',
        'classpath' => 'local/earlyalert/classes/external/record_log_ws.php',
        'description' => 'Inserts reporting log of early alert email',
        'type' => 'write',
        'capabilities' => '',
        'ajax' => true,
    ],
    'local_earlyalert_course_overview' => [
        'classname' => 'local_earlyalert_course_overview_ws',
        'methodname' => 'get_course_overview',
        'classpath' => 'local/earlyalert/classes/external/course_overview_ws.php',
        'description' => 'Returns all students with alerts for a course',
        'type' => 'write',
        'capabilities' => '',
        'ajax' => true,
    ],
    'local_earlyalert_update_student_status_instructor' => [
        'classname' => 'local_earlyalert_course_overview_ws',
        'methodname' => 'update_student_status_instructor',
        'classpath' => 'local/earlyalert/classes/external/course_overview_ws.php',
        'description' => 'Updates status for field student_advised_by_instructor',
        'type' => 'write',
        'capabilities' => '',
        'ajax' => true,
    ],
    'local_earlyalert_update_student_status_advisor' => [
        'classname' => 'local_earlyalert_course_overview_ws',
        'methodname' => 'update_student_status_advisor',
        'classpath' => 'local/earlyalert/classes/external/course_overview_ws.php',
        'description' => 'Updates status for field student_advised_by_advisor',
        'type' => 'write',
        'capabilities' => '',
        'ajax' => true,
    ],
    'local_earlyalert_get_users' => [
        'classname' => 'local_earlyalert_users_ws',
        'methodname' => 'get_users',
        'classpath' => 'local/earlyalert/classes/external/users_ws.php',
        'description' => 'Search users for a select box',
        'type' => 'read',
        'capabilities' => '',
        'ajax' => true,
    ],
    'local_earlyalert_get_courses' => [
        'classname' => 'local_earlyalert_courses_ws',
        'methodname' => 'get_courses',
        'classpath' => 'local/earlyalert/classes/external/courses_ws.php',
        'description' => 'User courses for a select box',
        'type' => 'read',
        'capabilities' => '',
        'ajax' => true,
    ],
    'local_earlyalert_get_message' => [
        'classname' => 'local_earlyalert_course_overview_ws',
        'methodname' => 'get_message',
        'classpath' => 'local/earlyalert/classes/external/course_overview_ws.php',
        'description' => 'Returns subject and body from email template',
        'type' => 'read',
        'capabilities' => '',
        'ajax' => true,
    ],
];
