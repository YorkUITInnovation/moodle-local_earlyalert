<?php

namespace local_earlyalert;

use core\event\role_assigned;
use FastRoute\RouteParser\Std;
use external_function_parameters;
use external_multiple_structure;
use external_single_structure;
use external_value;

class helper
{

    const PERIOD_FALL = 0;
    const PERIOD_WINTER = 1;
    const PERIOD_YEAR = 2;
    const PERIOD_WINTER_YEAR = 3;
    const PERIOD_SUMMER = 4;
    // Alert Types
    const ALERT_TYPE_GRADE = 'grade';
    const ALERT_TYPE_ASSIGN = 'assign';
    const ALERT_TYPE_EXAM = 'exam';

    public static function get_acad_year()
    {
        $month = date('n', time());
        switch ($month) {
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
            case 6:
            case 7:
            case 8:
                $acad_year = (date('Y', time()) - 1);
                break;
            case 9:
            case 10:
            case 11:
            case 12:
                $acad_year = date('Y', time());
                break;
        }
        return $acad_year;
    }

    public static function get_courses_in_acadyear($courses)
    {
        $year_to_process = self::get_acad_year();
        $data = array();
        $i = 0;
        foreach ($courses as $course) {
            if (isset($course->idnumber)) {
                $year_from_idnumber = strchr($course->idnumber, "_", true); // searches for first instance of year in course by looking for _
                $is_valid_year = is_numeric($year_from_idnumber);
                if ($is_valid_year && $year_from_idnumber == $year_to_process) {
                    $data[$i] = $course;
                    $i++;
                }
            }
        }
//print_object($data);
        return $data;
    }

    public static function get_courses_in_acadyear_by_row($courses)
    {
        $data = self::get_courses_in_acadyear($courses);
        // Take $data and set number of rows and columns to display based on the number of courses. You want to display no more than 3 columns per row.
        $num_courses = count($data);
        $num_rows = ceil($num_courses / 3);
        $num_cols = 3;
        $display_data['num_rows'] = $num_rows;
        $display_data['num_cols'] = $num_cols;
        // Loop trhough to put the courses into the correct row and column
        $row = 0;
        $col = 0;
        $i = 0;
        foreach ($data as $course) {
            if (is_object($course)) {
                $display_data['rows'][$row]['courses'][$col] = $course;
                $col++;
                if ($col == $num_cols) {
                    $col = 0;
                    $row++;
                }
            }
        }

        return $display_data;
    }

    public static function get_current_period()
    {
        $month = date('n', time());
        switch ($month) {
            case 1:
            case 2:
            case 3:
            case 4:
                $period = self::PERIOD_WINTER_YEAR;
                break;
            case 9:
            case 10:
            case 11:
            case 12:
                $period = self::PERIOD_FALL;
                break;
            default:
                $period = self::PERIOD_SUMMER;
        }
        return $period;
    }

    // build array of all students grades in a course
    public static function get_moodle_grades($courses)
    {
        global $CFG, $DB;
        require_once($CFG->dirroot . '/lib/gradelib.php');
        require_once($CFG->dirroot . '/grade/querylib.php');
        require_once($CFG->dirroot . '/lib/grade/grade_item.php');
        require_once($CFG->dirroot . '/lib/enrollib.php');
        require_once($CFG->dirroot . "/enrol/externallib.php");


        try {
            $students = array();
            if (isset($courses)) {
                foreach ($courses as $course) {
                    // pull student from enrolments
                    $users = enrol_get_course_users($course->id, true); // returns user objects of those enrolled in course
                    foreach ($users as $student) {
                        $grade = grade_get_course_grade($student->id, $course->id);
                        if ($grade->grade) {
                            $grade = ($grade->grade / $grade->item->grademax) * 100;
                            $student_grade = number_format((float)$grade,
                                '2');
                            $students[$student->id] = ['id' => $student->id, 'course_id' => $course->id, 'first_name' => $student->firstname, 'last_name' => $student->lastname, 'grade' => $student_grade, 'course' => $course->fullname];
                        }
                    }
                }
            }
            return $students;
        } catch (\Exception $e) {
            die($e->getMessage());
        }
    }

    public static function get_unit_department_from_courseid($courseid)
    {
        global $DB;

        // Check if the course is an academic course.
        if ($courseinfo = $DB->get_record('yorkcourseinfo', array('moodle' => $courseid))) {
            // Extract faculty and department from the course info record.
            $searchfac = $courseinfo->faculty;
            $searchdept = $courseinfo->department;

            // Search for the faculty unit.
            $foundfac = $DB->get_record('local_organization_unit', array('shortname' => $searchfac));

            // Search for the department within the faculty unit.
            $founddept = $DB->get_record('local_organization_dept', array('unit_id' => $foundfac->id, 'shortname' => $searchdept));

            // Return an associative array containing the unit ID and department ID.
            return array('unitid' => $foundfac->id, 'departmentid' => $founddept->id);
        } else {
            // The course is not an academic course. In this case, we may need to handle it differently.
            // For now, just return false.

            return false;
        }
    }

    public static function get_template_from_unit_department($unitid, $departmentid)
    {
        global $DB;

        // Check if a template exists with the given unit and department IDs.
        if ($template = $DB->get_record('local_et_email', array('unit' => $unitid . "_" . $departmentid, 'active' => 1))) {
            // Return the ID of the matching template.

            return $template->id;
        } elseif ($template = $DB->get_record('local_et_email', array('unit' => $unitid, 'active' => 1))) {
            // If no exact match is found, check for a partial match.
            // In this case, we're looking for the template that matches just the unit ID.

            return $template->id;
        } else {
            // No matching template was found. In this case, we may need to handle it differently.
            // For now, just return false.

            return false;
        }
    }

    public static function get_moodle_grades_by_course($course_id)
    {
        global $CFG, $DB;

        require_once($CFG->dirroot . '/lib/gradelib.php');
        require_once($CFG->dirroot . '/grade/querylib.php');
        require_once($CFG->dirroot . '/lib/grade/grade_item.php');
        require_once($CFG->dirroot . '/lib/enrollib.php');
        require_once($CFG->dirroot. "/user/profile/lib.php");


        try {
            // Start the LDAP connection in case we need it
            $LDAP = new ldap();
            // Set profile field ids
//            $campus_profile_field = new \stdClass();
//            if ($campus_profile_field != $DB->get_record('user_profile_field', ['shortname' => 'campus'], 'id')) {
//                $campus_profile_field->id = 0;
//            }
            $campus_profile_field = $DB->get_record('user_info_field', ['shortname' => 'campus']);

            $students = array();
            if (isset($course_id)) {
                // Pull student from enrolments.
                $users = enrol_get_course_users($course_id, true); // returns user objects of those enrolled in course
                foreach ($users as $student) {
                    $mdl_user = $DB->get_record('user', ['id' => $student->id]); // get moodle user

                    // Get the student's actual grade for the given course ID if gradebook is enabled
                    $grade = null;
                    $student_grade = null;

                    // Check if the course uses gradebook and get the actual grade
                    $course_grade_item = $DB->get_record('grade_items',
                        ['courseid' => $course_id, 'itemtype' => 'course'],
                        'id,grademax,grademin'
                    );

                    if ($course_grade_item) {
                        // Course has gradebook enabled, get the actual grade
                        $grade = grade_get_course_grade($student->id, $course_id);

                        if ($grade && $grade->grade !== null && $grade->grade !== '') {
                            // Convert the grade to a percentage if it's not already
                            if ($grade->item->grademax > 0) {
                                $grade_percentage = ($grade->grade / $grade->item->grademax) * 100;
                                $student_grade = number_format((float)$grade_percentage, 2);
                            } else {
                                $student_grade = number_format((float)$grade->grade, 2);
                            }
                        } else {
                            // No grade recorded yet - use placeholder
                            $student_grade = 'No Grade';
                        }
                    } else {
                        // Course doesn't use gradebook or gradebook is disabled
                        $student_grade = 'N/A';
                    }

                    // Get student campus, faculty, major
                    if ($campus = $DB->get_record_sql("SELECT uid.data AS 'campus'
                            FROM {user_info_data} uid
                            LEFT JOIN {user_info_field} uif on uid.fieldid=uif.id
                            WHERE uid.userid = ?
                            and uif.shortname = ?
                    ", array($student->id, 'campus'))) {
                        //has campus
                        $studentcampus = $campus->campus;
                    } else {
                        // Get user info from ldap
                        if (!empty($mdl_user) && !empty($mdl_user->id) && !empty($mdl_user->idnumber) && $campus_profile_field->id != 0) {

                            // get user profile record if ldap found a user
                            $user_profile = profile_user_record($mdl_user->id);
                            $student_info = $LDAP->get_student_info($mdl_user->idnumber);

                            // try getting campus from stream
                            $campus = helper::get_campus_from_stream($student_info['pystream']);

                            // Update campus profile field
                            $params = [
                                'userid' => $student->id,
                                'fieldid' => $campus_profile_field->id,
                                'data' => $campus,
                                'dataformat' => 0,
                            ];
                            $DB->insert_record('user_info_data', $params);
                        }
                        $studentcampus = $campus;
                    }
                    if ($faculty = $DB->get_record_sql("SELECT uid.data AS 'faculty'
                            FROM {user_info_data} uid
                            LEFT JOIN {user_info_field} uif on uid.fieldid=uif.id
                            WHERE uid.userid = ?
                            and uif.shortname = ?
                    ", array($student->id, 'ldapfaculty'))) {
                        //has faculty
                        $studentfaculty = $faculty->faculty;
                    } else {
                        $studentfaculty = '';
                    }
                    if ($major = $DB->get_record_sql("SELECT uid.data AS 'major'
                            FROM {user_info_data} uid
                            LEFT JOIN {user_info_field} uif on uid.fieldid=uif.id
                            WHERE uid.userid = ?
                            and uif.shortname = ?
                    ", array($student->id, 'ldapmajor'))) {
                        //has major
                        $studentmajor = $major->major;
                    } else {
                        $studentmajor = '';
                    }

                    // Include student in results if we have any grade info (even 'No Grade' or 'N/A')
                    // This ensures all enrolled students are shown regardless of grade status
                    $students[$student->id] = [
                        'id' => $student->id,
                        'course_id' => $course_id,
                        'first_name' => $student->firstname,
                        'last_name' => $student->lastname,
                        'grade' => $student_grade,
                        'lang' => $mdl_user->lang ? strtolower($mdl_user->lang) : 'en',
                        'idnumber' => $student->idnumber,
                        'campus' => $studentcampus,
                        'faculty' => $studentfaculty,
                        'major' => $studentmajor
                    ];
                }
            }

            return $students;
        } catch (\Exception $e) {
            throw new \moodle_exception('errorcode', 'local_earlyalerts', '', null, $e->getMessage() . "\n" . $e->getTraceAsString());
        }
    }

    /**
     * @param $stream string
     * @return string
     */
    public static function get_campus_from_stream($stream, $faculty = '')
    {
        global $CFG, $DB;
        $streams = explode("\n", $CFG->earlyalert_markham_streams);

        if (in_array(trim(strtoupper($stream)), array_map('strtoupper', array_map('trim', $streams)))) {
            $campus = 'MK';
            return $campus;
        } else {
            if ($faculty == 'GL') {
                $campus = 'GL';
            } else {
                $campus = 'YK';
            }
        }

        return $campus;
    }

    /**
     * Get the percentage range for a given grade letter id.
     * Pass a value <= 0 (e.g., -1) to indicate no grade filtering.
     *
     * @param int $grade_letter_id
     * @return array|null Returns ['min' => float, 'max' => float] or null when no filter
     */
    public static function get_moodle_grade_percent_range($grade_letter_id)
    {
        try {
            $grade_letters = new \local_earlyalert\grade_letters();
            $grade_ranges = $grade_letters->get_grade_percentage_range();
            if ($grade_letter_id > 0 && isset($grade_ranges[$grade_letter_id])) {
                return $grade_ranges[$grade_letter_id];
            } else {
                // Explicitly return null to indicate no filtering
                return null;
            }

        } catch (\Exception $e) {
            base::debug_to_console('it died'. $e->getMessage());
            die($e->getMessage());
        }
    }

    /**
     * Check if the current user is a teacher.
     *
     * @return bool
     */
    public static function is_teacher()
    {
        global $USER, $DB;
        // Get role ID for editing teacher.
        $editing_teacher = $DB->get_record('role', array('shortname' => 'editingteacher'), 'id');
        // Get Role ID for teacher.
        $teacher = $DB->get_record('role', array('shortname' => 'teacher'), 'id');
        // SQL to get user roles based on the editing_teacher and teacher role IDs.
        $sql = "SELECT * FROM {role_assignments} WHERE userid = ? AND roleid IN ($editing_teacher->id, $teacher->id)";
        // Get user roles.
        if ($userroles = $DB->get_records_sql($sql, array($USER->id))) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Check if the current user is an advisor for early alerts.
     *
     * @return bool
     */
    public static function is_advisor()
    {
        global $USER, $DB;
        // Get role ID for advisor.
        $advisor = $DB->get_record('role', array('shortname' => 'ea_advisor'), 'id');
        // SQL to get user roles based on the editing_teacher and teacher role IDs.
        $sql = "SELECT * FROM {role_assignments} WHERE userid = ? AND roleid IN ($advisor->id)";
        // Get user roles.
        if ($userroles = $DB->get_records_sql($sql, array($USER->id))) {
            return true;
        } else {
            return false;
        }
    }


    /**
     * Check if the current user is a student.
     *
     * @return bool
     */
    public static function is_student()
    {
        global $USER, $DB;
        // Get Role ID for student.
        $student = $DB->get_record('role', array('shortname' => 'student'), 'id');
        // SQL to get user roles based on the editing_teacher and teacher role IDs.
        $sql = "SELECT * FROM {role_assignments} WHERE userid = ? AND roleid IN ($student->id, $student->id)";
        // Get user roles.
        if ($userroles = $DB->get_records_sql($sql, array($USER->id))) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Test what the get_courses webservice would return for a user
     * @param int $userid
     * @return array
     */
    public static function test_get_courses_ws($userid) {
        global $DB;
        $show_active_only = !empty($CFG->earlyalert_showactivecourses);
        $courses = [];
        if ($userid) {
            if (!$usercourses = enrol_get_users_courses($userid, ['onlyactive' => $show_active_only])) {
                \local_earlyalert\base::debug_to_console('no course');
            }
            $course_data = self::get_courses_in_acadyear_by_row($usercourses);
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
     * @param $campus
     * @param $faculty
     * @param $department
     * @param $course_name
     * @param $course_number
     * @param $message_type
     * @param $lang
     * @return \stdClass
     * @throws \dml_exception
     */
    public static function get_email_template($campus, $faculty, $department, $course_name, $course_number, $message_type, $lang) {
        global $DB;

        // campus cannot be null period enforced in all cases
        if (empty($campus)) {
            return null;
        }

        $sql = "
        SELECT * FROM (
                SELECT *, 
                    CASE
                        -- you can have campus, faculty, department with course and course number
                        -- campus, faculty with course and course number
                        -- campus only with course and course number
                        -- campus cannot be null or empty when course and course number are provided
                        -- specific cases with course and course number
                        -- assume message type and lang are always provided
                        WHEN campus = ? AND faculty = ? AND department = ? AND course = ? AND coursenumber = ? AND message_type = ? AND lang = ? THEN 1
                        WHEN campus = ? AND faculty = ? AND (department IS NULL OR department = '') AND course = ? AND coursenumber = ? AND message_type = ? AND lang = ? THEN 2
                        WHEN campus = ? AND (faculty IS NULL OR faculty = '') AND (department IS NULL OR department = '') AND course = ? AND coursenumber = ? AND message_type = ? AND lang = ? THEN 3
                        
                        -- more general cases without course and course number
                        -- 1. campus, faculty, department
                        -- 2. campus, faculty
                        -- 3. check campus only templates
                        -- 4. check faculty only templates
                        -- last case should be faculty specific templates
                        -- campus cannot be null or empty when faculty is provided
                        -- campus cannot be null or empty when department is provided
                        -- campus cannot be null period.
                        WHEN campus = ? AND faculty = ? AND department = ? AND message_type = ? AND lang = ? THEN 4
                        WHEN campus = ? AND faculty = ? AND (department IS NULL OR department = '') AND message_type = ? AND lang = ? THEN 5
                        WHEN campus = ? AND faculty = ?  AND message_type = ? AND lang = ? THEN 6
                        WHEN campus = ? AND (faculty IS NULL OR faculty = '') AND (department IS NULL OR department = '')  AND message_type = ? AND lang = ? THEN 7
                        WHEN campus = ? AND message_type = ? AND lang = ? THEN 8
                        WHEN faculty = ? AND message_type = ? AND lang = ? THEN 9                                                       
                        ELSE NULL
                    END AS priority
                FROM {local_et_email}
                WHERE active = 1 AND deleted = 0
                 ) AS templates
        WHERE priority IS NOT NULL
        ORDER BY priority ASC
        LIMIT 1
        ";

        $search_params = [
            // CASE condition 1
            $campus, $faculty, $department, $course_name, $course_number, $message_type, $lang,
            // CASE condition 2
            $campus, $faculty, $course_name, $course_number, $message_type, $lang,
            // CASE condition 3
            $campus, $course_name, $course_number, $message_type, $lang,
            // CASE condition 4
            $campus, $faculty, $department, $message_type, $lang,
            // CASE condition 5
            $campus, $faculty, $message_type, $lang,
            // CASE condition 6
            $campus, $faculty, $message_type, $lang,
            // CASE condition 7
            $campus, $message_type, $lang,
            // CASE condition 8
            $campus, $message_type, $lang,
            // CASE condition 9
            $faculty, $message_type, $lang,
        ];

        return $DB->get_record_sql($sql, $search_params);
    }

}
