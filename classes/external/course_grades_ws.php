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
require_once($CFG->dirroot . '/lib/enrollib.php');

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

            // Resolve [grade] placeholder text for use in the bulk preview.
            $gradeletter = null;
            if ($grade_letter_id > 0) {
                $selectedgraderange = helper::get_moodle_grade_percent_range($grade_letter_id);
                $gradeletter = $selectedgraderange['letter'] ?? null;
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
                        // Check if the student's grade falls within the selected letter grade range.
                        $include_student = $grade_value >= $grade_range['min'] && $grade_value <= $grade_range['max'];
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
                    $preload_data = $email->preload_template($courseid, $student_record, $teacher_user_id);

                    // Resolve remaining placeholders ([grade], [assignmenttitle], [custommessage]) in the
                    // bulk preview. [assignmenttitle] and [custommessage] are not known at this stage so
                    // they are passed as null and left as-is in the message (they are resolved at send time).
                    $resolved_data = \local_etemplate\email::replace_message_placeholders(
                        $preload_data->message,
                        $preload_data->subject,
                        $courseid,
                        $student_record,
                        $teacher_user_id,
                        $gradeletter
                    );

                    // Merge student data with template data
                    $student_and_template_data = array_merge($student, [
                        'templateKey' => $templateKey,
                        'subject' => $resolved_data->subject,
                        'message' => $resolved_data->message,
                        'templateid' => $preload_data->templateid,
                        'revision_id' => $preload_data->revision_id,
                        'course_id' => $courseid,
                        'hascustommessage' => isset($template->hascustommessage) ? (int)$template->hascustommessage : 0,
                        'instructor_id' => $preload_data->instructor_id,
                        'triggered_from_user_id' => $preload_data->triggered_from_user_id
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

    /**
     * Parameters for paginated student lookup.
     *
     * @return external_function_parameters
     */
    public static function get_course_students_page_parameters() {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course id', VALUE_REQUIRED),
            'teacher_user_id' => new external_value(PARAM_INT, 'Teacher user id', VALUE_REQUIRED),
            'alert_type' => new external_value(PARAM_TEXT, 'Alert type', VALUE_DEFAULT, 'grade'),
            'filtermode' => new external_value(PARAM_TEXT, 'course|single|multi', VALUE_DEFAULT, 'course'),
            'multimode' => new external_value(PARAM_TEXT, 'any|average|weighted', VALUE_DEFAULT, 'any'),
            'condition' => new external_value(PARAM_TEXT, 'below|above|missing', VALUE_DEFAULT, 'below'),
            'thresholdid' => new external_value(PARAM_INT, 'Grade letter id', VALUE_DEFAULT, 7),
            'thresholdpercent' => new external_value(PARAM_FLOAT, 'Numeric threshold percent', VALUE_DEFAULT, -1),
            'gradeitemid' => new external_value(PARAM_INT, 'Single grade item id', VALUE_DEFAULT, 0),
            'gradeitemids' => new external_value(PARAM_RAW, 'JSON array of grade item ids for multi mode', VALUE_DEFAULT, '[]'),
            'includeallstudents' => new external_value(PARAM_BOOL, 'Include all students regardless of grade filter', VALUE_DEFAULT, false),
            'search' => new external_value(PARAM_RAW_TRIMMED, 'Search text', VALUE_DEFAULT, ''),
            'page' => new external_value(PARAM_INT, '1-based page number', VALUE_DEFAULT, 1),
            'perpage' => new external_value(PARAM_INT, 'Rows per page', VALUE_DEFAULT, 25),
            'sortby' => new external_value(PARAM_TEXT, 'name|idnumber|grade', VALUE_DEFAULT, 'name'),
            'sortdir' => new external_value(PARAM_TEXT, 'none|asc|desc', VALUE_DEFAULT, 'none'),
        ]);
    }

    /**
     * Returns paged flagged students for a course.
     *
     * @param int $courseid
     * @param int $teacher_user_id
     * @param string $alert_type
     * @param string $filtermode
     * @param string $multimode
     * @param string $condition
     * @param int $thresholdid
    * @param float $thresholdpercent
     * @param int $gradeitemid
     * @param string $gradeitemids
    * @param bool $includeallstudents
     * @param string $search
     * @param int $page
     * @param int $perpage
     * @param string $sortby
     * @param string $sortdir
     * @return array
     */
    public static function get_course_students_page(
        $courseid,
        $teacher_user_id,
        $alert_type,
        $filtermode,
        $multimode,
        $condition,
        $thresholdid,
        $thresholdpercent,
        $gradeitemid,
        $gradeitemids,
        $includeallstudents,
        $search,
        $page,
        $perpage,
        $sortby,
        $sortdir
    ) {
        global $DB;

        $params = self::validate_parameters(self::get_course_students_page_parameters(), [
            'courseid' => $courseid,
            'teacher_user_id' => $teacher_user_id,
            'alert_type' => $alert_type,
            'filtermode' => $filtermode,
            'multimode' => $multimode,
            'condition' => $condition,
            'thresholdid' => $thresholdid,
            'thresholdpercent' => $thresholdpercent,
            'gradeitemid' => $gradeitemid,
            'gradeitemids' => $gradeitemids,
            'includeallstudents' => $includeallstudents,
            'search' => $search,
            'page' => $page,
            'perpage' => $perpage,
            'sortby' => $sortby,
            'sortdir' => $sortdir,
        ]);

        $coursecontext = \context_course::instance((int)$params['courseid']);
        self::validate_context($coursecontext);

        $perpage = max(10, min(100, (int)$params['perpage']));
        $page = max(1, (int)$params['page']);
        $offset = ($page - 1) * $perpage;
        $search = trim((string)$params['search']);

        $selectedrange = helper::get_moodle_grade_percent_range((int)$params['thresholdid']);

        $courseitem = $DB->get_record('grade_items', ['courseid' => (int)$params['courseid'], 'itemtype' => 'course'], 'id,grademax');

        list($enrolledsql, $enrolledparams) = get_enrolled_sql($coursecontext, 'mod/assign:submit', 0, true);

        $sqlparams = $enrolledparams;
        $sqlparams['courseid'] = (int)$params['courseid'];

        $fromsql = "
            FROM {user} u
            JOIN ({$enrolledsql}) eu ON eu.id = u.id
            LEFT JOIN {grade_items} gi_course ON gi_course.courseid = :courseid AND gi_course.itemtype = 'course'
            LEFT JOIN {grade_grades} gg_course ON gg_course.itemid = gi_course.id AND gg_course.userid = u.id
            LEFT JOIN {user_info_field} campusf ON campusf.shortname = 'campus'
            LEFT JOIN {user_info_data} campusd ON campusd.userid = u.id AND campusd.fieldid = campusf.id
            LEFT JOIN {user_info_field} facultyf ON facultyf.shortname = 'ldapfaculty'
            LEFT JOIN {user_info_data} facultyd ON facultyd.userid = u.id AND facultyd.fieldid = facultyf.id
            LEFT JOIN {user_info_field} majorf ON majorf.shortname = 'ldapmajor'
            LEFT JOIN {user_info_data} majord ON majord.userid = u.id AND majord.fieldid = majorf.id
        ";

        $wheres = ["u.deleted = 0", "u.suspended = 0"];

        if ($search !== '') {
            $wheres[] = "(" . $DB->sql_like($DB->sql_fullname('u.firstname', 'u.lastname'), ':search', false) .
                " OR " . $DB->sql_like('u.idnumber', ':searchid', false) . ")";
            $sqlparams['search'] = '%' . $DB->sql_like_escape($search) . '%';
            $sqlparams['searchid'] = '%' . $DB->sql_like_escape($search) . '%';
        }

        $mode = in_array($params['filtermode'], ['course', 'single', 'multi']) ? $params['filtermode'] : 'course';
        $condition = self::get_condition_for_alert_type((string)$params['alert_type']);
        $multimode = in_array($params['multimode'], ['any', 'average', 'weighted']) ? $params['multimode'] : 'any';
        $thresholdpercent = (float)$params['thresholdpercent'];

        $uselettergraderange = !($thresholdpercent >= 0 && $thresholdpercent <= 100);

        if (!$uselettergraderange) {
            if ($condition === 'above') {
                $thresholdmin = $thresholdpercent;
                $thresholdmax = 100;
            } else {
                $thresholdmin = 0;
                $thresholdmax = $thresholdpercent;
            }
        } else {
            if (!empty($selectedrange)) {
                $thresholdmin = $selectedrange['min'];
                $thresholdmax = $selectedrange['max'];
            } else {
                $thresholdmin = 101;
                $thresholdmax = 100;
            }
        }

        $multimodethresholdmin = $thresholdmin;
        $multimodethresholdmax = $thresholdmax;
        $applygradefilters = empty($params['includeallstudents']);

        if ($applygradefilters && $mode === 'course') {
            $wheres[] = self::build_grade_condition_sql(
                'gg_course.finalgrade',
                'gi_course.grademax',
                $condition,
                $thresholdmin,
                $thresholdmax,
                $sqlparams,
                'c',
                $uselettergraderange
            );
        }

        if ($applygradefilters && $mode === 'single' && !empty($params['gradeitemid'])) {
            $sqlparams['singleitemid'] = (int)$params['gradeitemid'];
            $sqlparams['singleitemnow'] = time();
            $fromsql .= "
                LEFT JOIN {grade_items} gi_single ON gi_single.id = :singleitemid
                    AND (gi_single.hidden = 0 OR (gi_single.hidden > 1 AND gi_single.hidden < :singleitemnow))
                LEFT JOIN {grade_grades} gg_single ON gg_single.itemid = gi_single.id AND gg_single.userid = u.id
            ";
            $wheres[] = self::build_grade_condition_sql(
                'gg_single.finalgrade',
                'gi_single.grademax',
                $condition,
                $thresholdmin,
                $thresholdmax,
                $sqlparams,
                's',
                $uselettergraderange
            );
        } else if ($applygradefilters && $mode === 'single') {
            $wheres[] = '1 = 0';
        }

        if ($applygradefilters && $mode === 'multi') {
            $selecteditemids = json_decode((string)$params['gradeitemids'], true);
            if (!is_array($selecteditemids)) {
                $selecteditemids = [];
            }
            $selecteditemids = array_values(array_filter(array_map('intval', $selecteditemids)));
            $multimode = in_array($params['multimode'], ['any', 'average', 'weighted']) ? $params['multimode'] : 'any';

            if (!empty($selecteditemids)) {
                list($insql, $inparams) = $DB->get_in_or_equal($selecteditemids, SQL_PARAMS_NAMED, 'mid');
                $sqlparams = array_merge($sqlparams, $inparams);
                $sqlparams['multicourseid'] = (int)$params['courseid'];
                $sqlparams['multinow'] = time();

                if ($multimode === 'any') {
                    $subparams = [];
                    $subsql = self::build_grade_condition_sql(
                        'ggm.finalgrade',
                        'gim.grademax',
                        $condition,
                        $thresholdmin,
                        $thresholdmax,
                        $subparams,
                        'm',
                        $uselettergraderange
                    );
                    $sqlparams = array_merge($sqlparams, $subparams);
                    $wheres[] = "EXISTS (
                        SELECT 1
                          FROM {grade_items} gim
                          LEFT JOIN {grade_grades} ggm ON ggm.itemid = gim.id AND ggm.userid = u.id
                                         WHERE gim.courseid = :multicourseid
                           AND gim.id {$insql}
                           AND (gim.hidden = 0 OR (gim.hidden > 1 AND gim.hidden < :multinow))
                           AND {$subsql}
                    )";
                } else if ($multimode === 'average') {
                    $averagepercentexpr = "CASE
                        WHEN SUM(CASE WHEN ggm.finalgrade IS NOT NULL THEN gim.grademax ELSE 0 END) = 0 THEN NULL
                        ELSE (
                            SUM(CASE WHEN ggm.finalgrade IS NOT NULL THEN ggm.finalgrade ELSE 0 END) /
                            SUM(CASE WHEN ggm.finalgrade IS NOT NULL THEN gim.grademax ELSE 0 END)
                        ) * 100
                    END";
                    $averagehavingsql = self::build_percent_condition_sql(
                        $averagepercentexpr,
                        $condition,
                        $multimodethresholdmin,
                        $multimodethresholdmax,
                        $sqlparams,
                        'ma',
                        $uselettergraderange
                    );
                    $wheres[] = "u.id IN (
                        SELECT ggm.userid
                          FROM {grade_items} gim
                          JOIN {grade_grades} ggm ON ggm.itemid = gim.id
                         WHERE gim.courseid = :multicourseid
                           AND gim.id {$insql}
                           AND (gim.hidden = 0 OR (gim.hidden > 1 AND gim.hidden < :multinow))
                           AND ggm.finalgrade IS NOT NULL
                      GROUP BY ggm.userid
                        HAVING {$averagehavingsql}
                    )";
                } else if ($multimode === 'weighted') {
                    $weightedpercentexpr = "CASE
                        WHEN SUM(CASE WHEN ggm.finalgrade IS NOT NULL THEN COALESCE(gim.grademax, 0) * COALESCE(gim.aggregationcoef, 0) ELSE 0 END) = 0 THEN NULL
                        ELSE (
                            SUM(CASE WHEN ggm.finalgrade IS NOT NULL THEN ggm.finalgrade * COALESCE(gim.aggregationcoef, 0) ELSE 0 END) /
                            SUM(CASE WHEN ggm.finalgrade IS NOT NULL THEN COALESCE(gim.grademax, 0) * COALESCE(gim.aggregationcoef, 0) ELSE 0 END)
                        ) * 100
                    END";
                    $weightedhavingsql = self::build_percent_condition_sql(
                        $weightedpercentexpr,
                        $condition,
                        $multimodethresholdmin,
                        $multimodethresholdmax,
                        $sqlparams,
                        'mw',
                        $uselettergraderange
                    );
                    $wheres[] = "u.id IN (
                        SELECT ggm.userid
                          FROM {grade_items} gim
                          JOIN {grade_grades} ggm ON ggm.itemid = gim.id
                         WHERE gim.courseid = :multicourseid
                           AND gim.id {$insql}
                           AND (gim.hidden = 0 OR (gim.hidden > 1 AND gim.hidden < :multinow))
                            AND ggm.finalgrade IS NOT NULL
                           AND gim.aggregationcoef IS NOT NULL
                           AND gim.aggregationcoef > 0
                      GROUP BY ggm.userid
                        HAVING {$weightedhavingsql}
                    )";
                }
            } else {
                $wheres[] = '1 = 0';
            }
        }

        $whereclause = implode(' AND ', $wheres);

        $countsql = "SELECT COUNT(1) {$fromsql} WHERE {$whereclause}";
        $total = (int)$DB->count_records_sql($countsql, $sqlparams);

        $sortby = in_array($params['sortby'], ['name', 'idnumber', 'grade']) ? $params['sortby'] : 'name';
        $sortdir = in_array($params['sortdir'], ['none', 'asc', 'desc']) ? $params['sortdir'] : 'none';

        $orderby = 'u.lastname ASC, u.firstname ASC';
        if ($sortdir !== 'none') {
            $direction = strtoupper($sortdir) === 'DESC' ? 'DESC' : 'ASC';
            if ($sortby === 'idnumber') {
                $orderby = "u.idnumber {$direction}, u.lastname ASC, u.firstname ASC";
            } else if ($sortby === 'grade') {
                $gradepercent = "CASE WHEN gg_course.finalgrade IS NULL OR gi_course.grademax IS NULL OR gi_course.grademax = 0 THEN NULL ELSE (gg_course.finalgrade / gi_course.grademax) * 100 END";
                $orderby = "({$gradepercent} IS NULL) ASC, {$gradepercent} {$direction}, u.lastname ASC, u.firstname ASC";
            } else {
                $orderby = "u.lastname {$direction}, u.firstname {$direction}";
            }
        }

        $selectsql = "
            SELECT u.id,
                   u.firstname,
                   u.lastname,
                   u.idnumber,
                   u.email,
                   u.lang,
                   COALESCE(campusd.data, '') AS campus,
                   COALESCE(facultyd.data, '') AS faculty,
                   COALESCE(majord.data, '') AS major,
                   gg_course.finalgrade AS coursefinalgrade,
                   gi_course.grademax AS coursegrademax
            {$fromsql}
            WHERE {$whereclause}
            ORDER BY {$orderby}
        ";

        $records = $DB->get_records_sql($selectsql, $sqlparams, $offset, $perpage);
        $records = array_values($records);

        $displaygradebyuser = [];
        $matcheditemsbyuser = [];
        if (!empty($records)) {
            $pageuserids = array_map(static function($row) {
                return (int)$row->id;
            }, $records);

            if ($mode === 'course') {
                foreach ($records as $row) {
                    $displaygradebyuser[(int)$row->id] = self::format_grade_display($row->coursefinalgrade, $row->coursegrademax);
                }
            } else             if ($mode === 'single' && !empty($params['gradeitemid'])) {
                $displaygradebyuser = self::get_grade_display_for_item((int)$params['gradeitemid'], $pageuserids);
            } else if ($mode === 'multi') {
                $selecteditemids = json_decode((string)$params['gradeitemids'], true);
                if (!is_array($selecteditemids)) {
                    $selecteditemids = [];
                }
                $selecteditemids = array_values(array_filter(array_map('intval', $selecteditemids)));
                $displaygradebyuser = self::get_grade_display_for_multi_items($selecteditemids, $pageuserids, $condition);
            }

            if ($mode === 'single' && !empty($params['gradeitemid'])) {
                $matcheditemsbyuser = self::get_matched_grade_items(
                    [(int)$params['gradeitemid']],
                    $pageuserids,
                    $condition,
                    $thresholdmin,
                    $thresholdmax,
                    $uselettergraderange
                );
            } else if ($mode === 'multi') {
                $selecteditemids = json_decode((string)$params['gradeitemids'], true);
                if (!is_array($selecteditemids)) {
                    $selecteditemids = [];
                }
                $selecteditemids = array_values(array_filter(array_map('intval', $selecteditemids)));
                $multimode = in_array($params['multimode'], ['any', 'average', 'weighted']) ? $params['multimode'] : 'any';

                if ($multimode === 'any') {
                    $matcheditemsbyuser = self::get_matched_grade_items(
                        $selecteditemids,
                        $pageuserids,
                        $condition,
                        $thresholdmin,
                        $thresholdmax,
                        $uselettergraderange
                    );
                } else {
                    $matcheditemsbyuser = self::get_average_grade_for_multi_items(
                        $selecteditemids,
                        $pageuserids,
                        $multimode,
                        $condition,
                        $thresholdmin,
                        $thresholdmax,
                        $uselettergraderange
                    );
                }
            }
        }

        $courserecord = $DB->get_record('course', ['id' => (int)$params['courseid']], 'id,idnumber');
        $coursename = '';
        $coursenumber = '';
        if (!empty($courserecord->idnumber)) {
            $parts = explode('_', $courserecord->idnumber);
            $coursename = $parts[2] ?? '';
            $coursenumber = $parts[4] ?? '';
        }

        $messageType = self::map_alert_type_to_message_type($params['alert_type']);

        $students = [];
        foreach ($records as $row) {
            $lang = self::process_lang_for_templates($row->lang ?? 'en');
            $template = null;
            try {
                $template = helper::get_email_template(
                    trim((string)$row->campus),
                    trim((string)$row->faculty),
                    trim((string)$row->major),
                    $coursename,
                    $coursenumber,
                    $messageType,
                    $lang
                );
            } catch (\Throwable $e) {
                // Keep list loading resilient even if template mapping data is incomplete for one student.
                $template = null;
            }

            $students[] = [
                'id' => (int)$row->id,
                'first_name' => (string)$row->firstname,
                'last_name' => (string)$row->lastname,
                'idnumber' => (string)$row->idnumber,
                'email' => (string)$row->email,
                'grade' => $displaygradebyuser[(int)$row->id] ?? 'No Grade',
                'matcheditems' => implode("\n", $matcheditemsbyuser[(int)$row->id] ?? []),
                'campus' => (string)$row->campus,
                'faculty' => (string)$row->faculty,
                'major' => (string)$row->major,
                'templateid' => !empty($template->id) ? (int)$template->id : 0,
                'revision_id' => 0,
                'triggered_from_user_id' => (int)$params['teacher_user_id'],
                'instructor_id' => (int)$params['teacher_user_id'],
                'subject' => '',
                'message' => '',
            ];
        }

        return [
            'students' => $students,
            'total' => $total,
            'page' => $page,
            'perpage' => $perpage,
            'hasmore' => ($offset + count($students)) < $total,
        ];
    }

    /**
     * Returns for paginated student response.
     *
     * @return external_single_structure
     */
    public static function get_course_students_page_returns() {
        return new external_single_structure([
            'students' => new external_multiple_structure(new external_single_structure([
                'id' => new external_value(PARAM_INT, 'Student id'),
                'first_name' => new external_value(PARAM_TEXT, 'First name'),
                'last_name' => new external_value(PARAM_TEXT, 'Last name'),
                'idnumber' => new external_value(PARAM_TEXT, 'Student id number'),
                'email' => new external_value(PARAM_TEXT, 'Email'),
                'grade' => new external_value(PARAM_TEXT, 'Display grade'),
                'matcheditems' => new external_value(PARAM_RAW, 'Matched selected grade items'),
                'campus' => new external_value(PARAM_TEXT, 'Campus'),
                'faculty' => new external_value(PARAM_TEXT, 'Faculty'),
                'major' => new external_value(PARAM_TEXT, 'Major'),
                'templateid' => new external_value(PARAM_INT, 'Resolved template id'),
                'revision_id' => new external_value(PARAM_INT, 'Template revision id'),
                'triggered_from_user_id' => new external_value(PARAM_INT, 'Triggered from user id'),
                'instructor_id' => new external_value(PARAM_INT, 'Instructor user id'),
                'subject' => new external_value(PARAM_RAW, 'Template subject'),
                'message' => new external_value(PARAM_RAW, 'Template message'),
            ])),
            'total' => new external_value(PARAM_INT, 'Total matched students'),
            'page' => new external_value(PARAM_INT, 'Current page'),
            'perpage' => new external_value(PARAM_INT, 'Per page'),
            'hasmore' => new external_value(PARAM_BOOL, 'Whether next page exists'),
        ]);
    }

    /**
     * Parameters for course grade items.
     *
     * @return external_function_parameters
     */
    public static function get_course_grade_items_parameters() {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course id', VALUE_REQUIRED),
        ]);
    }

    /**
     * Returns gradebook items for filtering.
     *
     * @param int $courseid
     * @return array
     */
    public static function get_course_grade_items($courseid) {
        global $DB;

        $params = self::validate_parameters(self::get_course_grade_items_parameters(), ['courseid' => $courseid]);
        $context = \context_course::instance((int)$params['courseid']);
        self::validate_context($context);

        $sql = "SELECT id, itemname, itemtype, itemmodule
                  FROM {grade_items}
                 WHERE courseid = :courseid
                   AND itemtype != 'course'
                   AND (hidden = 0 OR (hidden > 1 AND hidden < :now))
              ORDER BY sortorder ASC";

        $items = $DB->get_records_sql($sql, [
            'courseid' => (int)$params['courseid'],
            'now' => time(),
        ]);
        $results = [];
        foreach ($items as $item) {
            $label = trim((string)$item->itemname);
            if ($label === '') {
                $label = get_string('unnamed_grade_item', 'local_earlyalert');
            }
            $results[] = [
                'id' => (int)$item->id,
                'name' => $label,
                'itemtype' => (string)$item->itemtype,
            ];
        }

        return $results;
    }

    /**
     * Return structure for grade items.
     *
     * @return external_multiple_structure
     */
    public static function get_course_grade_items_returns() {
        return new external_multiple_structure(new external_single_structure([
            'id' => new external_value(PARAM_INT, 'Grade item id'),
            'name' => new external_value(PARAM_TEXT, 'Display name'),
            'itemtype' => new external_value(PARAM_TEXT, 'Grade item type'),
        ]));
    }

    /**
     * Parameters for student preview template.
     *
     * @return external_function_parameters
     */
    public static function get_student_preview_template_parameters() {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course id', VALUE_REQUIRED),
            'teacher_user_id' => new external_value(PARAM_INT, 'Teacher user id', VALUE_REQUIRED),
            'studentid' => new external_value(PARAM_INT, 'Student id', VALUE_REQUIRED),
            'alert_type' => new external_value(PARAM_TEXT, 'Alert type', VALUE_DEFAULT, 'grade'),
            'thresholdid' => new external_value(PARAM_INT, 'Grade threshold id', VALUE_DEFAULT, 7),
            'thresholdpercent' => new external_value(PARAM_FLOAT, 'Numeric threshold percent', VALUE_DEFAULT, -1),
            'assignment_title' => new external_value(PARAM_RAW_TRIMMED, 'Assignment/quiz title', VALUE_DEFAULT, ''),
            'custom_message' => new external_value(PARAM_RAW, 'Custom instructor message', VALUE_DEFAULT, ''),
        ]);
    }

    /**
     * Build a preview message for one student.
     *
     * @param int $courseid
     * @param int $teacher_user_id
     * @param int $studentid
     * @param string $alert_type
     * @param int $thresholdid
     * @param float $thresholdpercent
     * @param string $assignment_title
     * @param string $custom_message
     * @return array
     */
    public static function get_student_preview_template(
        $courseid,
        $teacher_user_id,
        $studentid,
        $alert_type,
        $thresholdid,
        $thresholdpercent,
        $assignment_title,
        $custom_message
    ) {
        global $DB;

        $params = self::validate_parameters(self::get_student_preview_template_parameters(), [
            'courseid' => $courseid,
            'teacher_user_id' => $teacher_user_id,
            'studentid' => $studentid,
            'alert_type' => $alert_type,
            'thresholdid' => $thresholdid,
            'thresholdpercent' => $thresholdpercent,
            'assignment_title' => $assignment_title,
            'custom_message' => $custom_message,
        ]);

        $coursecontext = \context_course::instance((int)$params['courseid']);
        self::validate_context($coursecontext);

        $student = $DB->get_record('user', ['id' => (int)$params['studentid']], '*', MUST_EXIST);

        $campus = (string)$DB->get_field_sql("SELECT uid.data
                                               FROM {user_info_data} uid
                                               JOIN {user_info_field} uif ON uif.id = uid.fieldid
                                              WHERE uid.userid = :userid
                                                AND uif.shortname = 'campus'", ['userid' => $student->id]) ?: '';
        $faculty = (string)$DB->get_field_sql("SELECT uid.data
                                                FROM {user_info_data} uid
                                                JOIN {user_info_field} uif ON uif.id = uid.fieldid
                                               WHERE uid.userid = :userid
                                                 AND uif.shortname = 'ldapfaculty'", ['userid' => $student->id]) ?: '';
        $major = (string)$DB->get_field_sql("SELECT uid.data
                                              FROM {user_info_data} uid
                                              JOIN {user_info_field} uif ON uif.id = uid.fieldid
                                             WHERE uid.userid = :userid
                                               AND uif.shortname = 'ldapmajor'", ['userid' => $student->id]) ?: '';

        $course = $DB->get_record('course', ['id' => (int)$params['courseid']], 'id,fullname,idnumber', MUST_EXIST);
        $coursename = '';
        $coursenumber = '';
        if (!empty($course->idnumber)) {
            $parts = explode('_', $course->idnumber);
            $coursename = $parts[2] ?? '';
            $coursenumber = $parts[4] ?? '';
        }

        $messageType = self::map_alert_type_to_message_type($params['alert_type']);
        $templatelang = self::process_lang_for_templates((string)$student->lang);
        $template = helper::get_email_template($campus, $faculty, $major, $coursename, $coursenumber, $messageType, $templatelang);
        if (!$template && $templatelang === 'fr') {
            $template = helper::get_email_template($campus, $faculty, $major, $coursename, $coursenumber, $messageType, 'en');
        }

        if (!$template) {
            return [
                'templateid' => 0,
                'revision_id' => 0,
                'triggered_from_user_id' => (int)$params['teacher_user_id'],
                'instructor_id' => (int)$params['teacher_user_id'],
                'target_user_id' => (int)$student->id,
                'course_id' => (int)$course->id,
                'subject' => get_string('preview_unavailable_subject', 'local_earlyalert'),
                'message' => get_string('preview_unavailable_message', 'local_earlyalert'),
            ];
        }

        $templateemail = new \local_etemplate\email((int)$template->id);
        $preload = $templateemail->preload_template((int)$course->id, $student, (int)$params['teacher_user_id']);

        $thresholdpercent = (float)$params['thresholdpercent'];
        if ($thresholdpercent >= 0 && $thresholdpercent <= 100) {
            $gradetext = rtrim(rtrim(number_format($thresholdpercent, 1, '.', ''), '0'), '.') . '%';
        } else {
            $selectedrange = helper::get_moodle_grade_percent_range((int)$params['thresholdid']);
            $gradetext = $selectedrange['letter'] ?? 'D+';
        }

        $prepared = \local_etemplate\email::replace_message_placeholders(
            (string)$preload->message,
            (string)$preload->subject,
            (int)$course->id,
            $student,
            (int)$params['teacher_user_id'],
            $gradetext,
            (string)$params['assignment_title'],
            (string)$params['custom_message']
        );

        return [
            'templateid' => (int)$preload->templateid,
            'revision_id' => (int)$preload->revision_id,
            'triggered_from_user_id' => (int)$preload->triggered_from_user_id,
            'instructor_id' => (int)$preload->instructor_id,
            'target_user_id' => (int)$student->id,
            'course_id' => (int)$course->id,
            'subject' => (string)$prepared->subject,
            'message' => (string)$prepared->message,
        ];
    }

    /**
     * Returns for student preview template.
     *
     * @return external_single_structure
     */
    public static function get_student_preview_template_returns() {
        return new external_single_structure([
            'templateid' => new external_value(PARAM_INT, 'Template id'),
            'revision_id' => new external_value(PARAM_INT, 'Template revision id'),
            'triggered_from_user_id' => new external_value(PARAM_INT, 'Triggered from user id'),
            'instructor_id' => new external_value(PARAM_INT, 'Instructor user id'),
            'target_user_id' => new external_value(PARAM_INT, 'Target student id'),
            'course_id' => new external_value(PARAM_INT, 'Course id'),
            'subject' => new external_value(PARAM_RAW, 'Preview subject'),
            'message' => new external_value(PARAM_RAW, 'Preview body'),
        ]);
    }

    /**
     * Builds a SQL snippet for grade filtering.
     *
     * @param string $gradefield
     * @param string $grademaxfield
     * @param string $condition
     * @param float $thresholdmin
     * @param float $thresholdmax
     * @param array $params
     * @param string $prefix
     * @param bool $uselettergraderange
     * @return string
     */
    private static function build_grade_condition_sql(
        $gradefield,
        $grademaxfield,
        $condition,
        $thresholdmin,
        $thresholdmax,
        &$params,
        $prefix,
        $uselettergraderange = false
    ) {
        if ($condition === 'missing') {
            return "{$gradefield} IS NULL";
        }

        $percentexpr = "CASE WHEN {$gradefield} IS NULL OR {$grademaxfield} IS NULL OR {$grademaxfield} = 0 THEN NULL ELSE ({$gradefield} / {$grademaxfield}) * 100 END";

        return self::build_percent_condition_sql(
            $percentexpr,
            $condition,
            $thresholdmin,
            $thresholdmax,
            $params,
            $prefix,
            $uselettergraderange
        );
    }

    /**
     * Build SQL for a percent-based threshold comparison.
     *
     * @param string $percentexpr
     * @param string $condition
     * @param float $thresholdmin
     * @param float $thresholdmax
     * @param array $params
     * @param string $prefix
     * @param bool $uselettergraderange
     * @return string
     */
    private static function build_percent_condition_sql(
        $percentexpr,
        $condition,
        $thresholdmin,
        $thresholdmax,
        &$params,
        $prefix,
        $uselettergraderange = false
    ) {
        $params[$prefix . 'thresholdmin'] = $thresholdmin;
        $params[$prefix . 'thresholdmax'] = $thresholdmax;

        if ($uselettergraderange || $condition === 'above') {
            return "{$percentexpr} >= :" . $prefix . "thresholdmin AND {$percentexpr} <= :" . $prefix . "thresholdmax";
        }

        return "{$percentexpr} <= :" . $prefix . "thresholdmax";
    }

    /**
     * Check whether a percent value matches the requested threshold.
     *
     * @param float $percent
     * @param string $condition
     * @param float $thresholdmin
     * @param float $thresholdmax
     * @param bool $uselettergraderange
     * @return bool
     */
    private static function grade_matches_threshold($percent, $condition, $thresholdmin, $thresholdmax, $uselettergraderange = false) {
        if ($uselettergraderange || $condition === 'above') {
            return $percent >= $thresholdmin && $percent <= $thresholdmax;
        }

        return $percent <= $thresholdmax;
    }

    /**
     * Format final grade as percentage text.
     *
     * @param float|null $finalgrade
     * @param float|null $grademax
     * @return string
     */
    private static function format_grade_display($finalgrade, $grademax) {
        if ($finalgrade === null || $grademax === null || (float)$grademax <= 0) {
            return 'No Grade';
        }
        $percent = ((float)$finalgrade / (float)$grademax) * 100;
        return number_format($percent, 1) . '%';
    }

    /**
     * Returns grade display map for one grade item across users.
     *
     * @param int $gradeitemid
     * @param array $userids
     * @return array
     */
    private static function get_grade_display_for_item($gradeitemid, array $userids) {
        global $DB;

        if (empty($userids)) {
            return [];
        }

        list($insql, $inparams) = $DB->get_in_or_equal($userids, SQL_PARAMS_NAMED, 'uid');
        $params = [
            'itemid' => $gradeitemid,
            'now' => time(),
        ] + $inparams;
        $sql = "SELECT gg.userid, gg.finalgrade, gi.grademax
                  FROM {grade_grades} gg
                  JOIN {grade_items} gi ON gi.id = gg.itemid
                 WHERE gg.itemid = :itemid
                   AND (gi.hidden = 0 OR (gi.hidden > 1 AND gi.hidden < :now))
                   AND gg.userid {$insql}";
        $records = $DB->get_records_sql($sql, $params);

        $results = [];
        foreach ($userids as $userid) {
            $results[(int)$userid] = 'No Grade';
        }
        foreach ($records as $record) {
            $results[(int)$record->userid] = self::format_grade_display($record->finalgrade, $record->grademax);
        }

        return $results;
    }

    /**
     * Returns representative grade display map for multi-item mode.
     *
     * @param array $gradeitemids
     * @param array $userids
     * @param string $condition
     * @return array
     */
    private static function get_grade_display_for_multi_items(array $gradeitemids, array $userids, $condition) {
        global $DB;

        $results = [];
        foreach ($userids as $userid) {
            $results[(int)$userid] = 'No Grade';
        }

        if (empty($gradeitemids) || empty($userids)) {
            return $results;
        }

        list($iteminsql, $itemparams) = $DB->get_in_or_equal($gradeitemids, SQL_PARAMS_NAMED, 'iid');
        list($userinsql, $userparams) = $DB->get_in_or_equal($userids, SQL_PARAMS_NAMED, 'uid');
        $params = ['now' => time()] + $itemparams + $userparams;

                $sql = "SELECT gg.userid, gg.finalgrade, gi.grademax
                  FROM {grade_items} gi
             LEFT JOIN {grade_grades} gg ON gg.itemid = gi.id
                 WHERE gi.id {$iteminsql}
                   AND (gi.hidden = 0 OR (gi.hidden > 1 AND gi.hidden < :now))
                   AND gg.userid {$userinsql}";
                $records = $DB->get_recordset_sql($sql, $params);

        $accum = [];
        foreach ($records as $record) {
            $userid = (int)$record->userid;
            if (!isset($accum[$userid])) {
                $accum[$userid] = [];
            }
            if ($record->finalgrade !== null && (float)$record->grademax > 0) {
                $accum[$userid][] = ((float)$record->finalgrade / (float)$record->grademax) * 100;
            }
        }
        $records->close();

        foreach ($accum as $userid => $percentages) {
            if (empty($percentages)) {
                $results[$userid] = 'No Grade';
                continue;
            }

            $value = min($percentages);
            if ($condition === 'above') {
                $value = max($percentages);
            }
            $results[$userid] = number_format($value, 1) . '%';
        }

        return $results;
    }

    /**
     * Returns selected grade items that match the current condition for each user.
     *
     * @param array $gradeitemids
     * @param array $userids
     * @param string $condition
     * @param float $thresholdmin
     * @param float $thresholdmax
     * @param bool $uselettergraderange
     * @return array
     */
    private static function get_matched_grade_items(
        array $gradeitemids,
        array $userids,
        $condition,
        $thresholdmin,
        $thresholdmax,
        $uselettergraderange = false
    ) {
        global $DB;

        $results = [];
        foreach ($userids as $userid) {
            $results[(int)$userid] = [];
        }

        if (empty($gradeitemids) || empty($userids)) {
            return $results;
        }

        list($iteminsql, $itemparams) = $DB->get_in_or_equal($gradeitemids, SQL_PARAMS_NAMED, 'miid');
        list($userinsql, $userparams) = $DB->get_in_or_equal($userids, SQL_PARAMS_NAMED, 'muid');
        $params = ['now' => time()] + $itemparams + $userparams;

        $sql = "SELECT CONCAT(u.id, '_', gi.id) AS recordid,
                       u.id AS userid,
                       gi.itemname,
                       gg.finalgrade,
                       gi.grademax
                  FROM {user} u
                  JOIN {grade_items} gi ON gi.id {$iteminsql}
             LEFT JOIN {grade_grades} gg ON gg.itemid = gi.id AND gg.userid = u.id
                 WHERE u.id {$userinsql}
                   AND (gi.hidden = 0 OR (gi.hidden > 1 AND gi.hidden < :now))
              ORDER BY gi.sortorder ASC, gi.itemname ASC";

        $records = $DB->get_recordset_sql($sql, $params);
        foreach ($records as $record) {
            $userid = (int)$record->userid;
            $finalgrade = $record->finalgrade;
            $grademax = $record->grademax;
            $match = false;

            if ($condition === 'missing') {
                $match = $finalgrade === null;
            } else if ($finalgrade !== null && $grademax !== null && (float)$grademax > 0) {
                $percent = ((float)$finalgrade / (float)$grademax) * 100;
                $match = self::grade_matches_threshold(
                    $percent,
                    $condition,
                    $thresholdmin,
                    $thresholdmax,
                    $uselettergraderange
                );
            }

            if ($match) {
                $itemname = trim((string)$record->itemname);
                if ($itemname === '') {
                    $itemname = get_string('unnamed_grade_item', 'local_earlyalert');
                }
                $results[$userid][] = $itemname . ' (' . self::format_grade_display($finalgrade, $grademax) . ')';
            }
        }
        $records->close();

        return $results;
    }

    /**
     * Returns average/weighted average grade for multi-item mode with matched items list.
     *
     * @param array $gradeitemids
     * @param array $userids
     * @param string $multimode
     * @param string $condition
     * @param float $thresholdmin
     * @param float $thresholdmax
     * @param bool $uselettergraderange
     * @return array
     */
    private static function get_average_grade_for_multi_items(
        array $gradeitemids,
        array $userids,
        $multimode,
        $condition,
        $thresholdmin,
        $thresholdmax,
        $uselettergraderange = false
    ) {
        global $DB;

        $results = [];
        foreach ($userids as $userid) {
            $results[(int)$userid] = [];
        }

        if (empty($gradeitemids) || empty($userids)) {
            return $results;
        }

        list($iteminsql, $itemparams) = $DB->get_in_or_equal($gradeitemids, SQL_PARAMS_NAMED, 'miid');
        list($userinsql, $userparams) = $DB->get_in_or_equal($userids, SQL_PARAMS_NAMED, 'muid');
        $params = ['now' => time()] + $itemparams + $userparams;

        if ($multimode === 'weighted') {
            $sql = "SELECT u.id AS userid,
                           SUM(COALESCE(gg.finalgrade, 0) * COALESCE(gi.aggregationcoef, 0)) AS weightedsum,
                           SUM(COALESCE(gi.grademax, 0) * COALESCE(gi.aggregationcoef, 0)) AS weightedmaxsum,
                           GROUP_CONCAT(CONCAT(gi.itemname, ' (', COALESCE(gg.finalgrade, 'No Grade'), '/', gi.grademax, ')') SEPARATOR '\n') AS itemlist
                      FROM {user} u
                      JOIN {grade_items} gi ON gi.id {$iteminsql}
                 LEFT JOIN {grade_grades} gg ON gg.itemid = gi.id AND gg.userid = u.id
                     WHERE u.id {$userinsql}
                       AND (gi.hidden = 0 OR (gi.hidden > 1 AND gi.hidden < :now))
                       AND gg.finalgrade IS NOT NULL
                       AND gi.aggregationcoef IS NOT NULL
                       AND gi.aggregationcoef > 0
                  GROUP BY u.id";
            $records = $DB->get_records_sql($sql, $params);

            foreach ($records as $record) {
                $userid = (int)$record->userid;
                $weightedsum = (float)$record->weightedsum;
                $weightedmaxsum = (float)$record->weightedmaxsum;

                if ($weightedmaxsum > 0) {
                    $percent = ($weightedsum / $weightedmaxsum) * 100;
                    $match = self::grade_matches_threshold(
                        $percent,
                        $condition,
                        $thresholdmin,
                        $thresholdmax,
                        $uselettergraderange
                    );

                    if ($match) {
                        $avgpercent = number_format($percent, 1) . '%';
                        $itemlist = $record->itemlist ?? '';
                        $results[$userid][] = 'Average: ' . $avgpercent . "\n" . $itemlist;
                    }
                }
            }
        } else {
            $sql = "SELECT u.id AS userid,
                           SUM(gg.finalgrade) AS gradesum,
                           SUM(gi.grademax) AS grademaxsum,
                           GROUP_CONCAT(CONCAT(gi.itemname, ' (', COALESCE(gg.finalgrade, 'No Grade'), '/', gi.grademax, ')') SEPARATOR '\n') AS itemlist
                      FROM {user} u
                      JOIN {grade_items} gi ON gi.id {$iteminsql}
                 LEFT JOIN {grade_grades} gg ON gg.itemid = gi.id AND gg.userid = u.id
                     WHERE u.id {$userinsql}
                       AND (gi.hidden = 0 OR (gi.hidden > 1 AND gi.hidden < :now))
                       AND gg.finalgrade IS NOT NULL
                  GROUP BY u.id";
            $records = $DB->get_records_sql($sql, $params);

            foreach ($records as $record) {
                $userid = (int)$record->userid;
                $gradesum = $record->gradesum;
                $grademaxsum = $record->grademaxsum;

                if ($gradesum !== null && $grademaxsum !== null && (float)$grademaxsum > 0) {
                    $percent = ((float)$gradesum / (float)$grademaxsum) * 100;
                    $match = self::grade_matches_threshold(
                        $percent,
                        $condition,
                        $thresholdmin,
                        $thresholdmax,
                        $uselettergraderange
                    );

                    if ($match) {
                        $avgpercent = number_format($percent, 1) . '%';
                        $itemlist = $record->itemlist ?? '';
                        $results[$userid][] = 'Average: ' . $avgpercent . "\n" . $itemlist;
                    }
                }
            }
        }

        return $results;
    }

    /**
     * Returns the locked filtering condition for an alert type.
     *
     * @param string $alerttype
     * @return string
     */
    private static function get_condition_for_alert_type($alerttype) {
        if ($alerttype === 'assign' || $alerttype === 'exam') {
            return 'missing';
        }
        if ($alerttype === 'commendation') {
            return 'above';
        }
        return 'below';
    }

    /**
     * Maps UI alert type to message type constant.
     *
     * @param string $alerttype
     * @return int
     */
    private static function map_alert_type_to_message_type($alerttype) {
        switch ($alerttype) {
            case 'assign':
                return email::MESSAGE_TYPE_ASSIGNMENT;
            case 'exam':
                return email::MESSAGE_TYPE_EXAM;
            case 'commendation':
                return email::MESSAGE_TYPE_CATCHALL;
            case 'grade':
            default:
                return email::MESSAGE_TYPE_GRADE;
        }
    }
}
