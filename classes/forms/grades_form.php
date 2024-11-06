<?php

namespace local_earlyalert\forms;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/lib/formslib.php');
require_once($CFG->dirroot . '/config.php');

use local_earlyalert\base;
use local_earlyalert\grade_letters;
class grades_form extends \moodleform
{
    protected function definition()
    {
        GLOBAL $PAGE;
        $formdata = $this->_customdata['formdata'];
        // Create form object
        $mform = $this->_form;
        $PAGE->requires->css('/local/earlyalert/css/gradeform.css');
        $context = \context_system::instance();

        $fields = array('id', 'course_id', 'grade', 'first_name', 'last_name');
        $grade_letters = new \local_earlyalert\grade_letters();
        $options = $grade_letters->get_select_array();
        $mform->addElement('header', 'grade_header', get_string('grade',  'local_earlyalert'), 'class="smaller-header"');

        // Hidden input field to hold the selected grades
        $mform->addElement('hidden', 'my_grade');

        foreach ($formdata as $row) {
            base::debug_to_console('Row');
//            base::debug_to_console($row);
            // Create a table row element

            $tableRowData = "";
            foreach ($row as $key => $value) {
//                base::debug_to_console($value);
                if ($key == 'first_name' || $key == 'last_name' || $key == 'grade') {
                    $tableRowData .= $value . " ";
                }
            }
            $mform->addElement('advcheckbox', 'atest', $tableRowData, ' ' , array('group' => 1), array(0, 1));
            unset($tableRowData);

            // Close the table row element
        }


        $this->set_data($formdata);
        $buttonarray=array();
        $buttonarray[] = $mform->createElement('submit', 'preview_button', get_string('preview_email', 'local_earlyalert'));
        $buttonarray[] = $mform->createElement('submit', 'save_button', get_string('send', 'local_earlyalert'));
        $mform->addGroup($buttonarray, 'buttonarray', '', ' ', false);
    }
    // Function to filter and display table data based on selected grade
    protected function filterTable($tableData = null, $selectedGrade = null) {
        base::debug_to_console('filterTable');
        base::debug_to_console($selectedGrade);
        $filteredData = [];
        foreach ($tableData as $row) {
            /*if (isset($row['grade']) && $row['grade'] >= $selectedGrade) {
                $filteredData[] = $row;
            }*/
        }
        return $filteredData;
    }



}
