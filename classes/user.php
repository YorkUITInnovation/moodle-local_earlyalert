<?php

namespace local_earlyalert;

class user
{
    /**
     *
     * @var int
     */
    private $id;

    /**
     *
     * @var string
     */
    private $first_name;

    /**
     *
     * @var string
     */
    private $last_name;

    /**
     *
     * @var string
     */
    private $table;


    /**
     *
     *
     */
    public function __construct($id, $first_name, $last_name)
    {
        global $CFG, $DB, $DB;
        $this->first_name =$first_name;
        $this->last_name = $$last_name;
        $this->$id = $id;
    }

    /**
     * @return id - bigint (18)
     */
    public function get_id()
    {
        return $this->id;
    }

    /**
     * @return first_name - varchar (255)
     */
    public function get_first_name()
    {
        return $this->first_name;
    }

    /**
     * @return last_name - varchar (15)
     */
    public function get_lastname()
    {
        return $this->last_name;
    }

    /**
     * @param Type: bigint (18)
     */
    public function set_id($id)
    {
        $this->id = $id;
    }

    /**
     * @param Type: varchar (255)
     */
    public function set_first_name($first_name)
    {
        $this->first_name = $first_name;
    }

    /**
     * @param Type: varchar (15)
     */
    public function set_lastname($last_name)
    {
        $this->last_name = $last_name;
    }
}