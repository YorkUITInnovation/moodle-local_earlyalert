<?php
/*
 * Author: Admin User
 * Create Date: 3-01-2024
 * License: LGPL 
 * 
 */

namespace local_etemplate;

use local_etemplate\crud;
use local_etemplate\base;

class email extends crud
{

    const MESSAGE_TYPE_EMAIL = 0;
    const MESSAGE_TYPE_INTERNAL = 1;

    /**
     *
     * @var int
     */
    private $id;

    /**
     *
     * @var int
     */
    private $parentid;

    /**
     *
     * @var string
     */
    private $name;

    /**
     *
     * @var string
     */
    private $subject;

    /**
     *
     * @var string
     */
    private $message;

    /**
     *
     * @var string
     */
    private $lang;

    /**
     *
     * @var int
     */
    private $active;

    /**
     *
     * @var int
     */
    private $messagetype;

    /**
     *
     * @var int
     */
    private $systemreserved;

    /**
     *
     * @var int
     */
    private $deleted;

    /**
     *
     * @var int
     */
    private $usermodified;

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

    /**
     *
     * @var int
     */
    private $unit;

    /**
     *
     *
     */
    public function __construct($id = 0)
    {
        global $CFG, $DB, $DB;

        $this->table = 'local_et_email';

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

        $this->parentid = $result->parentid ?? 0;
        $this->name = $result->name ?? '';
        $this->subject = $result->subject ?? '';
        $this->message = $result->message ?? '';
        $this->lang = $result->lang ?? '';
        $this->active = $result->active ?? 0;
        $this->messagetype = $result->messagetype ?? 0;
        $this->systemreserved = $result->systemreserved ?? 0;
        $this->deleted = $result->deleted ?? 0;
        $this->unit = $result->unit ?? 0;
        $this->usermodified = $result->usermodified ?? 0;
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
    public function get_parentid(): int
    {
        return $this->parentid;
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
    public function get_message(): string
    {
        return $this->message;
    }

    /**
     * @return lang - varchar (4)
     */
    public function get_lang(): string
    {
        return $this->lang;
    }

    /**
     * @return active - tinyint (2)
     */
    public function get_active(): int
    {
        return $this->active;
    }

    /**
     * @return messagetype - tinyint (2)
     */
    public function get_messagetype(): int
    {
        return $this->messagetype;
    }

    /**
     * @return systemreserved - tinyint (2)
     */
    public function get_systemreserved()
    {
        return $this->systemreserved;
    }

    /**
     * @return deleted - tinyint (2)
     */
    public function get_deleted(): int
    {
        return $this->deleted;
    }

    /**
     * @return usermodified - bigint (18)
     */
    public function get_usermodified(): int
    {
        return $this->usermodified;
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
    public function set_id(int $id): void
    {
        $this->id = $id;
    }

    /**
     * @param Type: bigint (18)
     */
    public function set_parentid($parentid)
    {
        $this->parentid = $parentid;
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
    public function set_message($message)
    {
        $this->message = $message;
    }

    /**
     * @param Type: varchar (4)
     */
    public function set_lang($lang)
    {
        $this->lang = $lang;
    }

    /**
     * @param Type: tinyint (2)
     */
    public function set_active($active)
    {
        $this->active = $active;
    }

    /**
     * @param Type: tinyint (2)
     */
    public function set_messagetype($messagetype)
    {
        $this->messagetype = $messagetype;
    }

    /**
     * @param Type: tinyint (2)
     */
    public function set_systemreserved($systemreserved)
    {
        $this->systemreserved = $systemreserved;
    }

    /**
     * @param Type: tinyint (2)
     */
    public function set_deleted($deleted)
    {
        $this->deleted = $deleted;
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
    public function set_timemodified(int $timemodified)
    {
        $this->timemodified = $timemodified;
    }

    public function delete_email(int $id){
        global $USER;
        $data = $this->get_record($id);
        $data->deleted = 1;
        $data->timemodified = time();
        $data->usermodified = $USER->id;
        $this->update_record($data);
    }
    public function undelete_email(int $id){
        global $USER;
        $data = $this->get_record($id);
        $data->deleted = 0;
        $data->timemodified = time();
        $data->usermodified = $USER->id;
        $this->update_record($data);
    }
    public function set_unit(int $unit)
    {
        $this->unit = $unit;
    }
    public function get_unit(){
        return $this->unit;
    }
}