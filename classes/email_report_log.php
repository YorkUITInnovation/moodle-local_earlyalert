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
        $this->subject = $result->subject ?? '';
        $this->body = $result->body ?? '';
        $this->triggered_from_user_id = $result->triggered_from_user_id ?? 0;
        $this->target_user_id = $result->target_user_id ?? 0;
        $this->user_read = $result->user_read ?? 0;
        $this->unit_id = $result->unit_id ?? 0;
        $this->department_id = $result->department_id ?? 0;
        $this->course_id = $result->course_id ?? 0;
        $this->instructor_id = $result->instructor_id ?? 0;
        $this->assignment_id = $result->assignment_id ?? 0;
        $this->trigger_grade = $result->trigger_grade ?? '';
        $this->trigger_grade_letter = $result->trigger_grade_letter ?? '';
        $this->actual_grade = $result->actual_grade ?? 0;
        $this->actual_grade_letter = $result->actual_grade_letter ?? 0;
        $this->student_advised = $result->student_advised ?? 0;
        $this->facultyspecific_text_id = $result->facultyspecific_text_id ?? 0;
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

    /**
     * @return timecreated - bigint (18)
     */
    public function get_timecreated(): int
    {
        return $this->timecreated;
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

    public function getInstructorId(): int
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

    public function getTriggerGradeLetter(): string
    {
        return $this->trigger_grade_letter;
    }

    public function setTriggerGradeLetter(string $trigger_grade_letter): void
    {
        $this->trigger_grade_letter = $trigger_grade_letter;
    }

    public function getActualGrade(): int
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
}