<?php

namespace local_earlyalert;


use core\event\role_assigned;

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
        require_once("../../../html/enrol/externallib.php");


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
        require_once("../../../html/enrol/externallib.php");


        try {
            $students = array();
            if (isset($course_id)) {
                // Pull student from enrolments.
                $users = enrol_get_course_users($course_id, true); // returns user objects of those enrolled in course
                foreach ($users as $student) {
                    // Get the student's grade for the given course ID.
                    $grade = grade_get_course_grade($student->id, $course_id);
                    // Get student campus, faculty, major
                    if ($campus = $DB->get_record_sql("SELECT uid.data AS 'campus'
                            FROM {user_info_data} uid
                            LEFT JOIN {user_info_field} uif on uid.fieldid=uif.id
                            WHERE uid.userid = ?
                            and uif.shortname = ?
                    ", array($student->id, 'campus'))){
                        //has campus
                        $studentcampus = $campus->campus;
                    } else {
                        $studentcampus = '';
                    }
                    if ($faculty = $DB->get_record_sql("SELECT uid.data AS 'faculty'
                            FROM {user_info_data} uid
                            LEFT JOIN {user_info_field} uif on uid.fieldid=uif.id
                            WHERE uid.userid = ?
                            and uif.shortname = ?
                    ", array($student->id, 'ldapfaculty'))){
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
                    ", array($student->id, 'ldapmajor'))){
                        //has major
                        $studentmajor = $major->major;
                    } else {
                        $studentmajor = '';
                    }
                    if ($grade->grade) {
                        // Convert the grade to a percentage and format it as a decimal number with two places.
                        $grade = ($grade->grade / $grade->item->grademax) * 100;
                        $student_grade = number_format((float)$grade,
                            '2');
                        $students[$student->id] = [
                            'id' => $student->id,
                            'course_id' => $course_id,
                            'first_name' => $student->firstname,
                            'last_name' => $student->lastname,
                            'grade' => $student_grade,
                            'idnumber' => $student->idnumber,
                            'campus' => $studentcampus,
                            'faculty' => $studentfaculty,
                            'major' => $studentmajor
                        ];
                    }
                }
            }

            return $students;
        } catch (\Exception $e) {
            base::debug_to_console('it died');
            die($e->getMessage());
        }
    }

    public static function get_moodle_grade_percent_range($grade_letter_id){
        try {
            $grade_letters = new \local_earlyalert\grade_letters();
            $grade_ranges = $grade_letters->get_grade_percentage_range();
           if ($grade_letter_id > 0 && isset($grade_ranges[$grade_letter_id])) {
                return $grade_ranges[$grade_letter_id];
            }
           else return [];

        } catch (\Exception $e) {
            base::debug_to_console('it died');
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

}