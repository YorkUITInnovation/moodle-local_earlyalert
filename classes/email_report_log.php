<?php
/*
 * Author: Admin User
 * Create Date: 3-01-2024
 * License: LGPL
 *
 */

namespace local_earlyalert;

use local_earlyalert\crud;
use local_earlyalert\base;

class email_report_log extends crud
{
CONST GRADE_F = 11;
CONST GRADE_D = 10;
CONST GRADE_D_PLUS = 9;
CONST GRADE_C_MINUS = 8;
CONST GRADE_C = 7;
CONST GRADE_C_PLUS = 6;
CONST GRADE_B_MINUS = 5;
CONST GRADE_B = 4;
CONST GRADE_B_PLUS = 3;
CONST GRADE_A_MINUS = 2;
CONST GRADE_A = 1;

    /**
     *
     * @var int
     */
    private $id;

    /**
     *
     * @var int
     */
    private $template_id;
    /**
     *
     * @var int
     */
    private $revision_id;
    /**
     *
     * @var int
     */
    private $triggered_from_user_id;

    /**
     *
     * @var int
     */
    private $target_user_id;
    /**
     *
     * @var int
     */
    private $unit_id;
    /**
     *
     * @var int
     */
    private $department_id;
    /**
     *
     * @var int
     */
    private $facultyspecific_text_id;
    /**
     *
     * @var int
     */
    private $course_id;
    /**
     *
     * @var int
     */
    private $instructor_id;
    /**
     *
     * @var int
     */
    private $assignment_id;

    /**
     *
     * @var int
     */
    private $trigger_grade;

    /**
     *
     * @var string
     */
    private $trigger_grade_letter;

    /**
     *
     * @var int
     */
    private $actual_grade;
    /**
     *
     * @var string
     */
    private $actual_grade_letter;
    /**
     *
     * @var int
     */
    private $student_advised;
    /**
     *
     * @var int
     */
    private $date_message_sent;

    /**
     *
     * @var string
     */
    private $subject;

    /**
     *
     * @var string
     */
    private $body;
    private $user_read;

    /**
     *
     * @var int
     */
    private $timecreated;

    /**
     *
     * @var string
     */
    private $timecreated_hr;

    /**
     *
     * @var int
     */
    private $timemodified;

    /**
     *
     * @var string
     */
    private $timemodified_hr;

    /**
     *
     * @var string
     */
    private $table;

    /**
     *
     * @var \stdClass
     */
    private $record;

    private $data;


    public function __construct($id = 0)
    {
        global $CFG, $DB, $DB;

        $this->table = 'local_earlyalert_report_log';

        parent::set_table($this->table);

        if ($id) {
            $this->id = $id;
            parent::set_id($this->id);
            $result = $this->get_record($this->table, $this->id);
        } else {
            $result = new \stdClass();
            $this->id = 0;
            parent::set_id($this->id);
        }

        $this->record = $result;

        $this->template_id = $result->template_id ?? 0;
        $this->revision_id = $result->revision_id ?? 0;
        $this->triggered_from_user_id = $result->triggered_from_user_id ?? 0;
        $this->target_user_id = $result->target_user_id ?? 0;
        $this->user_read = $result->user_read ?? 0;
        $this->course_id = $result->course_id ?? 0;
        $this->instructor_id = $result->instructor_id ?? 0;
        $this->assignment_name = $result->assignment_name ?? '';
        $this->trigger_grade = $result->trigger_grade ?? '';
        $this->actual_grade = $result->actual_grade ?? 0;
        $this->student_advised_by_advisor = $result->student_advised_by_advisor ?? 0;
        $this->student_advised_by_instructor = $result->student_advised_by_instructor ?? 0;
        $this->date_message_sent = $result->date_message_sent ?? 0;
        $this->timecreated = $result->timecreated ?? 0;
        $this->timecreated_hr = '';
        if ($this->timecreated) {
            $this->timecreated_hr = base::strftime(get_string('strftimedate'), $result->timecreated);
        }
        $this->timemodified = $result->timemodified ?? 0;
        $this->timemodified_hr = '';
        if ($this->timemodified) {
            $this->timemodified_hr = base::strftime(get_string('strftimedate'), $result->timemodified);
        }
    }

    public function insert_record($data)
    {
        global $DB;

        if (!isset($data->timecreated)) {
            $data->timecreated = time();
        }

        if (!isset($data->timemodified)) {
            $data->timemodified = time();
        }



        //Set user
//        $data->usermodified = $USER->id;

        $id = $DB->insert_record($this->table, (array)$data);

        return $id;
    }

    /**
     * @return \stdClass
     */
    public function get_record(): \stdClass
    {
        return parent::get_record();
    }

    /**
     * @return id - bigint (18)
     */
    public function get_id(): int
    {
        return $this->id;
    }

    /**
     * @return parentid - bigint (18)
     */
    public function get_templateid(): int
    {
        return $this->template_id;
    }

    /**
     * @return name - varchar (255)
     */
    public function get_name(): string
    {
        return $this->name;
    }

    /**
     * @return subject - varchar (255)
     */
    public function get_subject(): string
    {
        return $this->subject;
    }

    /**
     * @return message - longtext (-1)
     */
    public function get_body(): string
    {
        return $this->body;
    }

    public function get_user_read(): int
    {
        return $this->user_read;
    }

    public function get_course_id(): int
    {
        return $this->course_id;
    }

    public function get_trigger_grade_letter(): string {
        file_put_contents('/var/www/moodledata/trigger_grade.txt', $this->trigger_grade);
        switch ($this->trigger_grade) {
            case self::GRADE_F:
                return 'F';
            case self::GRADE_D:
                return 'D';
            case self::GRADE_D_PLUS:
                return 'D+';
            case self::GRADE_C_MINUS:
                return 'C-';
            case self::GRADE_C:
                return 'C';
            case self::GRADE_C_PLUS:
                return 'C+';
            case self::GRADE_B_MINUS:
                return 'B-';
            case self::GRADE_B:
                return 'B';
            case self::GRADE_B_PLUS:
                return 'B+';
            case self::GRADE_A_MINUS:
                return 'A-';
            case self::GRADE_A:
                return 'A';
            default:
                return 'D+';
        }
    }

    public function get_course_name(): string
    {
        global $DB;
        $course = $DB->get_record('course', array('id' => $this->course_id), 'fullname');
        return $course->fullname;
    }

    public function get_assignment_name(): string
    {
        return $this->assignment_name;
    }

    public function get_trigger_grade(): int|null
    {
        return $this->trigger_grade;
    }

    public function get_student_advised_by_advisor(): int
    {
        return $this->student_advised_by_advisor;
    }

    public function get_student_advised_by_instructor(): int
    {
        return $this->student_advised_by_instructor;
    }

    public function get_date_sent(): string
    {
        return $this->timecreated_hr;
    }
    /**
     * @return timecreated - bigint (18)
     */
    public function get_timecreated(): int
    {
        return $this->timecreated;
    }

    /**
     * Return the student details
     * @return \stdClass|false
     * @throws \dml_exception
     */
    public function get_student(): \stdClass|false
    {
        global $DB;
        if ($student = $DB->get_record('user', array('id' => $this->target_user_id))) {
            $sql = "Select
                        uid.data As major
                    From
                        {user_info_data} uid Inner Join
                        {user_info_field} uif On uid.fieldid = uif.id Inner Join
                        {user} u On u.id = uid.userid
                    Where
                        uid.userid = " . $this->target_user_id . " And
                        uif.shortname = 'ldapmajor'";
            if ($student_info = $DB->get_record_sql($sql)) {
                $student->major = $student_info->major;
            }
            return $student;
        }
        return $DB->get_record('user', array('id' => $this->target_user_id));
    }

    /**
     * Return the instructor details
     * @return \stdClass|false
     * @throws \dml_exception
     */
    public function get_instructor(): \stdClass|false
    {
        global $DB;
        return $DB->get_record('user', array('id' => $this->instructor_id));
    }

    /**
     * Return Unit Details: department, department_shortname, unit, unit_shortname, campus, campus_shortname
     * @return \stdClass|false
     * @throws \dml_exception
     */
    public function get_unit_information(): \stdClass|false
    {
        global $DB;

        if ($this->department_id) {
            $sql = "Select
                    od.name As department,
                    od.shortname As department_shortname,
                    ou.name As unit,
                    ou.shortname As unit_shortname,
                    oc.name As campus,
                    oc.shortname As campus_shortname
                From
                    {local_organization_dept} od Inner Join
                    {local_organization_unit} ou On od.unit_id = ou.id Inner Join
                    {local_organization_campus} oc On oc.id = ou.campus_id
                Where
";
            $sql .= " od.id = " . $this->department_id;

        } elseif ($this->unit_id) {
            $sql = "Select
                    ou.name As unit,
                    ou.shortname As unit_shortname,
                    oc.name As campus,
                    oc.shortname As campus_shortname
                From
                    {local_organization_unit} ou Inner Join
                    {local_organization_campus} oc On oc.id = ou.campus_id
                Where
";
            $sql .= " ou.id = " . $this->unit_id;
        } else {
            return false;
        }
        return $DB->get_record_sql($sql);

    }

    public function get_message_type(): string
    {
        $TEMPLATE = new \local_etemplate\email($this->template_id);
        $messageTypes = \local_etemplate\email::get_messagetype_nicename($TEMPLATE->get_messagetype());
        return $messageTypes;
    }

    /**
     * @return timemodified - bigint (18)
     */
    public function get_timemodified(): int
    {
        return $this->timemodified;
    }

    /**
     * @param Type: bigint (18)
     */
    public function set_id($id): void
    {
        $this->id = $id;
    }

    /**
     * @param Type: bigint (18)
     */
    public function set_templateid($template_id)
    {
        $this->template_id = $template_id;
    }

    /**
     * @param Type: varchar (255)
     */
    public function set_name($name)
    {
        $this->name = $name;
    }

    /**
     * @param Type: varchar (255)
     */
    public function set_subject($subject)
    {
        $this->subject = $subject;
    }

    /**
     * @param Type: longtext (-1)
     */
    public function set_body($body)
    {
        $this->body = $body;
    }

    /**
     * @param Type: varchar (4)
     */
    public function set_lang($lang)
    {
        $this->lang = $lang;
    }

    /**
     * @param Type: bigint (18)
     */
    public function set_usermodified(int $usermodified)
    {
        $this->usermodified = $usermodified;
    }

    /**
     * @param Type: bigint (18)
     */
    public function set_timecreated($timecreated)
    {
        $this->timecreated = $timecreated;
    }

    /**
     * @param Type: bigint (18)
     */
    public function set_timemodified($timemodified)
    {
        $this->timemodified = $timemodified;
    }

    public function getRevisionId(): int
    {
        return $this->revision_id;
    }

    public function setRevisionId( $revision_id): void
    {
        $this->revision_id = $revision_id;
    }

    public function getTriggeredFromUserId(): int
    {
        return $this->triggered_from_user_id;
    }

    public function setTriggeredFromUserId($triggered_from_user_id): void
    {
        $this->triggered_from_user_id = $triggered_from_user_id;
    }

    public function getTargetUserId(): int
    {
        return $this->target_user_id;
    }

    public function setTargetUserId($target_user_id): void
    {
        $this->target_user_id = $target_user_id;
    }

    public function getUserRead(): int
    {
        return $this->user_read;
    }

    public function setUserRead($user_read): void
    {
        $this->user_read = $user_read;
    }

    public function getUnitId(): int
    {
        return $this->unit_id;
    }

    public function setUnitId($unit_id): void
    {
        $this->unit_id = $unit_id;
    }

    public function getDepartmentId(): int
    {
        return $this->department_id;
    }

    public function setDepartmentId($department_id): void
    {
        $this->department_id = $department_id;
    }

    public function getFacultyspecificTextId(): int
    {
        return $this->facultyspecific_text_id;
    }

    public function setFacultyspecificTextId(int $facultyspecific_text_id): void
    {
        $this->facultyspecific_text_id = $facultyspecific_text_id;
    }

    public function getCourseId(): int
    {
        return $this->course_id;
    }

    public function setCourseId(int $course_id): void
    {
        $this->course_id = $course_id;
    }

    public function get_instructor_id(): int
    {
        return $this->instructor_id;
    }

    public function setInstructorId(int $instructor_id): void
    {
        $this->instructor_id = $instructor_id;
    }

    public function getAssignmentId(): int
    {
        return $this->assignment_id;
    }

    public function setAssignmentId(int $assignment_id): void
    {
        $this->assignment_id = $assignment_id;
    }

    public function getTriggerGrade(): int
    {
        return $this->trigger_grade;
    }

    public function setTriggerGrade(int $trigger_grade): void
    {
        $this->trigger_grade = $trigger_grade;
    }

    public function get_actual_grade(): int
    {
        return $this->actual_grade;
    }

    public function setActualGrade(int $actual_grade): void
    {
        $this->actual_grade = $actual_grade;
    }

    public function getActualGradeLetter(): string
    {
        return $this->actual_grade_letter;
    }

    public function setActualGradeLetter(string $actual_grade_letter): void
    {
        $this->actual_grade_letter = $actual_grade_letter;
    }

    public function getStudentAdvised(): int
    {
        return $this->student_advised;
    }

    public function setStudentAdvised(int $student_advised): void
    {
        $this->student_advised = $student_advised;
    }

    public function getDateMessageSent(): int
    {
        return $this->date_message_sent;
    }

    public function setDateMessageSent(int $date_message_sent): void
    {
        $this->date_message_sent = $date_message_sent;
    }

    /**
     * @return mixed
     */
    public function getData()
    {
        return $this->data;
    }

    /**
     * @param mixed $data
     */
    public function set_data($data): void
    {
        $this->data = $data;
    }
}