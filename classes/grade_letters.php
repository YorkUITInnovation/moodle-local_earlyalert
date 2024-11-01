<?php

namespace local_earlyalert;
use moodle_grades_grade;
class grade_letters
{
    /**
     *
     * @var string
     */
    private $results;

    /**
     *
     * @global \moodle_database $DB
     */
    public function __construct()
    {
        global $DB;
        $this->results = $DB->get_records('grade_letters');
    }

    /**
     * Get records
     */
    public function get_records()
    {
        return $this->results;
    }

    /**
     * Array to be used for selects
     * Defaults used key = record id, value = name
     * Modify as required.
     */
    public function get_select_array()
    {
        foreach ($this->results as $r) {
            $array[$r->id] = $r->letter;
        }
        return $array;
    }

    public function get_letter_value($grade_val){
        return grade_format_gradevalue_letter($grade_val, new \stdClass());
    }
}