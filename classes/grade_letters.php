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
        global $DB;

        // Fetch all grade letters for contextid = 1, ordered by lower boundary ascending.
        $grade_letters = $DB->get_records('grade_letters', ['contextid' => 1], 'lowerboundary ASC');

        if (empty($grade_letters)) {
            return [];
        }

        $grade_ranges = [];
        $letters_array = array_values($grade_letters); // Re-index numerically
        $highestboundary = 0.0;
        foreach ($letters_array as $letterrecord) {
            $highestboundary = max($highestboundary, (float)$letterrecord->lowerboundary);
        }

        // Moodle grade letters may be stored either as percentages (55, 60, ...)
        // or as normalized fractions (0.55, 0.60, ...). Convert everything to
        // percentage values so filtering logic can compare against 0-100 grades.
        $scalefactor = $highestboundary <= 1.0 ? 100.0 : 1.0;

        for ($i = 0; $i < count($letters_array); $i++) {
            $current_letter = $letters_array[$i];
            $min = (float)$current_letter->lowerboundary * $scalefactor;

            if ($i < count($letters_array) - 1) {
                // The max is the min of the next grade, minus a small amount.
                $next_letter = $letters_array[$i + 1];
                $max = ((float)$next_letter->lowerboundary * $scalefactor) - 0.01;
            } else {
                // This is the highest grade, so the max is 100.
                $max = 100.0;
            }

            $grade_ranges[$current_letter->id] = [
                'min' => $min,
                'max' => $max,
                'letter' => $current_letter->letter
            ];
        }
        return $grade_ranges;
    }


    public function get_letter_value($grade_val){
        return grade_format_gradevalue_letter($grade_val, new \stdClass());
    }
}