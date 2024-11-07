<?php

namespace local_earlyalert\forms;
defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/lib/formslib.php');
require_once($CFG->dirroot . '/config.php');

use local_earlyalert\base;
use local_earlyalert\grade_letters;
class grades_filter extends \moodleform
{
    protected function definition()
    {
        GLOBAL $PAGE;
        $PAGE->requires->js_call_amd('local_earlyalert/preview_student_email', 'init');
        // Load AMD module
        $PAGE->requires->js_call_amd('local_earlyalert/filter_students_grade', 'init');

        $formdata = $this->_customdata['formdata'];
        // Create form object
        $mform = $this->_form;

        $context = \context_system::instance();

        $grade_letters = new \local_earlyalert\grade_letters();
        $options = $grade_letters->get_select_array();
        if (isset($formdata->course_id)) {
            $mform->addElement('header', 'early_alert_filter_grade_header', "Grade's for " . $formdata -> courses[$formdata->course_id], 'class="smaller-header"');
            $mform->addElement('select', 'early_alert_filter_grade_select', get_string('select_grade', 'local_earlyalert'), $options, array('onchange' => 'javascript:filter_students_by_grade();'));

            // Create an empty section for the students list

            // Add a container element to hold the students list
            $mform->addElement('html', '<div id = "early_alert_filter_students_container"></div>');

            // Hidden input field to hold the selected grade
            $mform->addElement('hidden', 'student_ids');
            $mform->addElement('hidden', 'early_alert_filter_course_id', $formdata->course_id);

            $buttonarray=array();
            $buttonarray[] = $mform->createElement('button', 'early_alert_filter_preview_button', get_string('preview_email', 'local_earlyalert'));
            $buttonarray[] = $mform->createElement('submit', 'early_alert_filter_save_button', get_string('send', 'local_earlyalert'), array('onclick' => 'window.location.href = \'dashboard.php?course_id=' . $formdata->course_id . '\';'));
            $mform->addGroup($buttonarray, 'buttonarray', '', ' ', false);
        }

    }

}
