<?php

namespace local_earlyalert;



class helper
{

    const PERIOD_FALL = 0;
    const PERIOD_WINTER = 1;
    const PERIOD_YEAR = 2;
    const PERIOD_WINTER_YEAR = 3;
    const PERIOD_SUMMER = 4;
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
        $i=0;
        foreach($courses as $course){
            if (isset($course->idnumber)) {
                $year_from_idnumber = strchr($course->idnumber,"_",true); // searches for first instance of year in course by looking for _
                $is_valid_year = is_numeric($year_from_idnumber);
                if ($is_valid_year && $year_from_idnumber == $year_to_process) {
                    $data[$i] = $course;
                    $i++;
                }
            }
        }
        return $data;
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
                foreach($courses as $course){
                    // pull student from enrolments
                    $users = enrol_get_course_users($course->id, true); // returns user objects of those enrolled in course
                        foreach ($users as $student) {
                                $grade = grade_get_course_grade($student->id,$course->id);
                                if ($grade->grade) {
                                    $grade = ($grade->grade / $grade->item->grademax) * 100;
                                    $student_grade = number_format((float)$grade,
                                        '2');
                                    $students[$student->id] = ['id'=>$student->id, 'course_id'=>$course->id, 'first_name' => $student->firstname, 'last_name' => $student->lastname, 'grade'=>$student_grade];
                                }
                            }
                        }
                    }
            return $students;
        } catch (\Exception $e) {
            die($e->getMessage());
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
                // pull student from enrolments
                $users = enrol_get_course_users($course_id, true); // returns user objects of those enrolled in course
                foreach ($users as $student) {
                    $grade = grade_get_course_grade($student->id,$course_id);
                    if ($grade->grade) {
                        $grade = ($grade->grade / $grade->item->grademax) * 100;
                        $student_grade = number_format((float)$grade,
                            '2');
                        $students[$student->id] = ['id'=>$student->id, 'course_id'=>$course_id, 'first_name' => $student->firstname, 'last_name' => $student->lastname, 'grade'=>$student_grade];
                    }
                }
            }

            return $students;
        } catch (\Exception $e) {
            base::debug_to_console('it died');
            die($e->getMessage());
        }
    }

}