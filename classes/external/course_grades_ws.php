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
 * Web service for course grades functionality.
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
use local_etemplate\email;

/**
 * Course grades web service class.
 */
class local_earlyalert_course_grades_ws extends external_api {
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

                $template = helper::get_email_template($campus, $faculty, $department, $course_name, $course_number, $message_type, $lang);

                // If no template found and the language was FR, try with EN as a fallback.
                if (!$template && $lang === 'fr') {
                    $template = helper::get_email_template($campus, $faculty, $department, $course_name, $course_number, $message_type, 'en');
                }

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

            $templateCache = array_values($templateCache);
            // Sort the final list of students by last name before returning.
            usort($templateCache, function ($a, $b) {
                return strcasecmp($a['last_name'], $b['last_name']);
            });

            return $templateCache;
        } catch (Exception $e) {
            error_log('Error in get_course_student_templates: ' . $e->getMessage());
            throw new moodle_exception('errorprocessingrequest', 'local_earlyalert', '', null, $e->getMessage());
        }
    }

    private static function process_lang_for_templates($lang): string
    {
        $lang = strtolower($lang);
        // Business rule in webservice! If student does not have a language in English or French, default to English
        // Array of allowed languages (ISO 639-1 codes and variations)
        $allowed_en_languages = ['en', 'en-ca', 'en-us'];
        $allowed_fr_languages = ['fr', 'fr-ca', 'fr-fr'];
        if (in_array($lang, $allowed_en_languages)) {
            $lang = 'en';
        } else if (in_array($lang, $allowed_fr_languages)) {
            $lang = 'fr';
        } else { // any other language
            $lang = 'en';
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
