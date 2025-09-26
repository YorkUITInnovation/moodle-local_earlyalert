<?php

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/**
 * Description of ppyLookup
 *
 * @author patrick
 */

namespace local_earlyalert;

use local_earlyalert\base;

class ldap
{

    const PERIOD_FALL = 0;
    const PERIOD_WINTER = 1;
    const PERIOD_YEAR = 2;
    const PERIOD_WINTER_YEAR = 3;
    const PERIOD_SUMMER = 4;

    private $ldap_conn;
    private $ldap_bind;

    /**
     * Define DN's used for filtering
     */
    const PEOPLE_DN = "ou=People,dc=yorku,dc=ca";
    const SIS_DN = "ou=sis,ou=People,dc=yorku,dc=ca";
    const COURSES_DN = "ou=Courses,dc=yorku,dc=ca";
    const COURSES_GROUP_DN = "ou=courses,ou=Groups,dc=yorku,dc=ca";

    /**
     *
     * @global type $CFG
     * @global \moodle_database $DB
     */
    function __construct()
    {
        global $CFG, $DB;

        try {
            // connect to ldap server
            $this->ldap_conn = ldap_connect("$CFG->earlyalert_ldapurl");
            if (!$this->ldap_conn) {
                throw new \Exception("Could not connect to LDAP server.");
            }

            $ldap_rdn = 'uid=' . $CFG->earlyalert_ldapuser . ',ou=Applications,dc=yorku,dc=ca'; // ldap rdn or dn
            $ldap_pass = $CFG->earlyalert_ldappwd; // associated password
            // binding to ldap server
            $this->ldap_bind = @ldap_bind($this->ldap_conn, $ldap_rdn, $ldap_pass);
            if (!$this->ldap_bind) {
                throw new \Exception("Could not bind to LDAP server." . ldap_error($this->ldap_conn));
            }
        } catch (\Exception $e) {
            die($e->getMessage());
        }
    }

    public function get_ldap_conn()
    {
        return $this->ldap_conn;
    }

    public function getldap_bind()
    {
        return $this->ldap_bind;
    }

    /**
     *
     * @return array
     * @global \moodle_database $DB
     * @global \stdClass $USER
     * @global \stdClass $CFG
     */
    private function get_user_courses($acad_year = 2024, $id_number = 0,
                                      $user_name = '')
    {
        global $CFG, $DB, $USER;

        try {
            if ($id_number == 0 && $user_name == '') {
                /**
                 * Searching by idnumber is safer.
                 * However, if the idnumber is not set properly, use the username
                 */
                if (is_number(trim($USER->idnumber))) {
                    $search_on = 'pyCourseInstructorCyin';
                    $search_values = $USER->idnumber;
                } else {
                    $search_on = 'pyCourseInstructor';
                    $search_values = $USER->username;
                }
            } else if ($id_number > 0) {
                $search_on = 'pyCourseInstructorCyin';
                $search_values = $id_number;
            } else {
                $search_on = 'pyCourseInstructor';
                $search_values = $user_name;
            }

            $period = $this->get_current_period();
            /**
             * Build filter based on Courses DN
             */
            switch ($period) {
                case self::PERIOD_FALL:
                    $filter = '(&(pyCourseAcademicYear=' . $acad_year . ')(' . $search_on . '=' . $search_values . ')(pyCoursePeriod=F))';
                    break;
                case self::PERIOD_WINTER_YEAR:
                    $filter = '(|(&(pyCourseAcademicYear=' . $acad_year . ')(' . $search_on . '=' . $search_values . ')'
                        . '(pyCoursePeriod=F))(&(pyCourseAcademicYear=' . $acad_year . ')(' . $search_on . '=' . $search_values . ')(pyCoursePeriod=Y)))';
            }

            $filter = '(&(pyCourseAcademicYear=' . $acad_year . ')(' . $search_on . '=' . $search_values . '))';

            $results = false;

            if ($this->ldap_bind == true) {
                $search_results = ldap_search($this->get_ldap_conn(), self::COURSES_DN, $filter);
                $results = ldap_get_entries($this->get_ldap_conn(), $search_results);
            }

            return $results;
        } catch (\Exception $e) {
            die($e->getMessage());
        }
    }

    /**
     * Returns a list of courses
     * @param type $id_number
     * @param type $user_name
     * @global \local_earlyalert\type $CFG
     */
    public function get_course_list($id_number = 0, $user_name = '')
    {
        global $CFG;

        try {
            $acad_year = $this->get_acad_year();

            $courses = $this->get_user_courses($acad_year, $id_number, $user_name);

            $period = $this->get_current_period();

            /* Loop through courses */
            $coursesArray = [];
            for ($i = 0; $i < $courses['count']; $i++) {

                switch ($courses[$i]['pycourseperiod'][0]) {
                    case 'F':
                        $coursePeriod = self::PERIOD_FALL;
                        break;
                    case 'W':
                    case 'Y':
                        $coursePeriod = self::PERIOD_WINTER_YEAR;
                        break;
                }

                $coursesArray[$i]['cn'] = $courses[$i]['cn'][0];
                $coursesArray[$i]['title'] = $courses[$i]['pycourseacademicyear'][0] . ' '
                    . $courses[$i]['pycourseperiodfaculty'][0] . ' '
                    . $courses[$i]['pycoursesubject'][0] . ' '
                    . $courses[$i]['pycoursecourseid'][0] . ' '
                    . $courses[$i]['pycoursesection'][0] . ' '
                    . $courses[$i]['pycourseinstructionalformat'][0] . ' '
                    . $courses[$i]['pycoursegroupnumber'][0] . ' '
                    . $courses[$i]['description'][0] . ' '
                    . '(' . $courses[$i]['pycourseperiod'][0] . ')';
            }
            return $coursesArray;
        } catch (\Exception $e) {
            die($e->getMessage());
        }
    }

    /**
     * Returns a single course based on course group dn (Includes students)
     * @param string $cn
     * @return type
     */
    public function get_course($cn)
    {
        try {
            /**
             * Build filter based on Courses DN
             */
            $filter = '(&(cn=' . $cn . '))';
            $search_results = ldap_search($this->get_ldap_conn(),
                self::COURSES_GROUP_DN, $filter);
            $results = ldap_get_entries($this->get_ldap_conn(), $search_results);

            return $results;
        } catch (\Exception $e) {
            die($e->getMessage());
        }
    }

    /**
     *
     * @param type $cn
     * @global \moodle_database $DB
     */
    public function print_course_students($cn)
    {
        global $DB;
        try {
            $context = \context_system::instance();
            $course = $this->get_course($cn);
            $courseStudents = $course[0]['memberuid'];

            $cnArray = explode('_', $cn);
            $lang = $cnArray[8];
            $students = [];
            $student = [];

            for ($i = 0; $i < $courseStudents['count']; $i++) {
                $student[$i] = $this->get_user_info($courseStudents[$i], $cn);
                $students[$i]['username'] = $courseStudents[$i];
                $students[$i]['firstname'] = $student[$i]['firstname'];
                $students[$i]['lastname'] = $student[$i]['lastname'];
                $students[$i]['email'] = $student[$i]['email'];
                $students[$i]['faculty'] = $student[$i]['faculty'];
                $students[$i]['sisid'] = $student[$i]['sisid'];
                $students[$i]['grade'] = $student[$i]['grade'];
            }

            base::array_sort_by_column($students, 'lastname');

            return $students;
        } catch (\Exception $e) {
            die($e->getMessage());
        }
    }

    /**
     * @param $streams array
     * @return array|false|void
     */
    public function get_users_based_on_stream($streams)
    {
        if (count($streams) < 1) {
            return false;
        }
        try {
            $filter = '(|';
            for ($i = 0; $i < count($streams); $i++) {
                if ($i == 0){
                    $filter .= '(pystream=' . trim($streams[$i]) . ')';
                } else {
                    $filter .= '(|(pystream=' . trim($streams[$i]) . '))';
                }

            }
            $filter .= ')';

            $search_results = ldap_search($this->get_ldap_conn(), self::PEOPLE_DN,
                $filter);
            $results = ldap_get_entries($this->get_ldap_conn(), $search_results);

            return $results;

        } catch (\Exception $e) {
            die($e->getMessage());
        }
    }

    /**
     * @param $faculty string
     * @return array|false|void
     */
    public function get_users_based_on_faculty($faculty)
    {
        if (empty($faculty)) {
            echo 'No faculty';
            return false;
        }
        try {
            $filter = '(pyFaculty=' . $faculty . ')';
            $search_results = ldap_search($this->get_ldap_conn(), self::PEOPLE_DN,
                $filter);
            $results = ldap_get_entries($this->get_ldap_conn(), $search_results);

            return $results;

        } catch (\Exception $e) {
            die($e->getMessage());
        }
    }

    public function get_user_info($uid, $cn = false)
    {
        try {
            $filter = '(&(pycyin=' . $uid . '))';
            $search_results = ldap_search($this->get_ldap_conn(), self::PEOPLE_DN,
                $filter);
            $results = ldap_get_entries($this->get_ldap_conn(), $search_results);

            if (isset($results[0]['pypreferredmail'][0])) {
                $email = $results[0]['pypreferredmail'][0];
            } else {
                $email = $results[0]['pyatlasmail'][0];
            }

            if (isset($results[0]['pyfaculty'][0])) {
                $faculty = $results[0]['pyfaculty'][0];
            } else {
                $faculty = $results[0]['pyemploymentunit1'][0];
            }

            if (isset($results[0]['pystream'][0])) {
                $stream = $results[0]['pystream'][0];
            } else {
                $stream = 'NO';
            }

            if ($cn) {
                //Get course in Moodle if it exists
                $grade = $this->get_moodle_grade($cn, $results[0]['pycyin'][0]);
            } else {
                $grade = '';
            }

            $user = array(
                'username' => $results[0]['uid'][0],
                'lastname' => $results[0]['sn'][0],
                'firstname' => $results[0]['givenname'][0],
                'email' => $email,
                'sisid' => $results[0]['pycyin'][0],
                'faculty' => $faculty,
                'stream' => $stream,
                'mayatype' => $results[0]['pymayatype'][0],
                'grade' => $grade
            );

            return $user;
        } catch (\Exception $e) {
            die($e->getMessage());
        }
    }

    public function get_student_info($sisid)
    {
        try {
            $filter = '(&(pyCyin=' . $sisid . '))';
            $search_results = ldap_search($this->get_ldap_conn(), self::SIS_DN,
                $filter);
            $results = ldap_get_entries($this->get_ldap_conn(), $search_results);

            if (isset($results[0]['pystream'][0])) {
                $stream = $results[0]['pystream'][0];
            } else {
                $stream = 'NO';
            }

            $user = array(
                'lastname' => $results[0]['sn'][0],
                'firstname' => $results[0]['givenname'][0],
                'email' => $results[0]['pypreferredmail'][0],
                'sisid' => $results[0]['pycyin'][0],
                'faculty' => $results[0]['pyfaculty'][0],
                'stream' => $stream,
                'courses' => $results[0]['pycourse'],
                'username' => $results[0]['uid'],
            );

            return $user;
        } catch (\Exception $e) {
            die($e->getMessage());
        }
    }

    /**
     *
     * @param type $cn
     * @param type $sisid
     * @return string
     * @global \moodle_database $DB
     * @global \local_earlyalert\type $CFG
     */
    public function get_moodle_grade($cn, $sisid)
    {
        global $CFG, $DB;
        require_once($CFG->dirroot . '/lib/gradelib.php');
        require_once($CFG->dirroot . '/grade/querylib.php');
        require_once($CFG->dirroot . '/lib/grade/grade_item.php');

        try {
            $student_grade = '';
            $show_active_only = !empty($CFG->earlyalert_showactivecourses);
            if ($course = $DB->get_record('course', ['idnumber' => $cn])) {
                if ($student = $DB->get_record('user', ['idnumber' => $sisid])) {
                    if ($enrolments = enrol_get_users_courses($student->id, ['onlyactive' => $show_active_only])) {
                        foreach ($enrolments as $e) {
                            if ($e->idnumber == $cn) {
                                $grade = grade_get_course_grade($student->id,
                                    $course->id);
                                if ($grade->grade) {
                                    $grade = ($grade->grade / $grade->item->grademax) * 100;
                                    $student_grade = number_format((float)$grade,
                                        '2');
                                }
                            }
                        }
                    }
                }
            }

            return $student_grade;
        } catch (\Exception $e) {
            die($e->getMessage());
        }
    }

    /**
     * Returns Course based on course dn (Does not include students)
     * @param string $cn
     * @return array
     */
    public function get_course_info($cn)
    {
        try {
            /**
             * Build filter based on Courses DN
             */
            $filter = '(cn=' . $cn . ')';

            $search_results = ldap_search($this->get_ldap_conn(), self::COURSES_DN,
                $filter);
            $results = ldap_get_entries($this->get_ldap_conn(), $search_results);

            return $results;
        } catch (\Exception $e) {
            die($e->getMessage());
        }
    }

    /**
     * Returns the course name based on the cn
     * @param string $cn
     * @return string
     */
    public function get_course_name($cn)
    {
        try {
            $course = $this->get_course_info($cn);

            $course_name = $course[0]['pycourseacademicyear'][0] . ' '
                . $course[0]['pycourseperiodfaculty'][0] . ' '
                . $course[0]['pycoursesubject'][0] . ' '
                . $course[0]['pycoursecourseid'][0] . ' '
                . $course[0]['pycoursesection'][0] . ' '
                . $course[0]['pycourseinstructionalformat'][0] . ' '
                . $course[0]['pycoursegroupnumber'][0] . ' '
                . $course[0]['description'][0] . ' '
                . '(' . $course[0]['pycourseperiod'][0] . ')';

            return $course_name;
        } catch (\Exception $e) {
            die($e->getMessage());
        }
    }

    /**
     * Returns the academic year based on the current month
     * @return int
     */
    public function get_acad_year()
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

    /**
     * Returns numeric representation of period
     * Fall = 0
     * Winter = 1
     * Year = 2
     * Winter and Year = 3
     */
    public function get_current_period()
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

}