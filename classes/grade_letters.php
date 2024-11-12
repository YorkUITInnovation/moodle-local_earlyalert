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

    /**
     * Get grade percentage given a grade id.
     */
    public function get_grade_percentage_range()
    {
        global $CFG, $DB;

        // Select all rows from the grade_letters table
        $grades = $DB->get_records('grade_letters',null, 'id ASC');
        $grade_count = count($grades);
        $percentage_ranges = [];

        for ($i=1; $i <= $grade_count; $i++) {
            if ($i==1){
                $current_max_grade = 100;
                $current_min_grade = $grades[$i]->lowerboundary;
                $percentage_ranges[$grades[$i]->id] = ['min' => $current_min_grade, 'max' => $current_max_grade];
            }
            else {
                $current_max_grade = $percentage_ranges[$i-1]['min']-.1;
                $current_min_grade = $grades[$i]->lowerboundary;
                $percentage_ranges[$grades[$i]->id] = ['min' => $current_min_grade, 'max' => $current_max_grade];
            }
        }
        return $percentage_ranges;

    }

    public function get_letter_value($grade_val){
        return grade_format_gradevalue_letter($grade_val, new \stdClass());
    }
}