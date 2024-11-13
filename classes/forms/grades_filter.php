<?php

namespace local_earlyalert\forms;
defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/lib/formslib.php');
require_once($CFG->dirroot . '/config.php');

use local_earlyalert\base;
use local_earlyalert\grade_letters;
use local_earlyalert\helper;

class grades_filter extends \moodleform
{
    protected function definition()
    {
        GLOBAL $PAGE;
        $PAGE->requires->js_call_amd('local_earlyalert/preview_student_email', 'init');
        // Load AMD module
        $PAGE->requires->js_call_amd('local_earlyalert/filter_students_grade', 'init');
        $PAGE->requires->js_call_amd('local_earlyalert/send_email_notification', 'init');

        $formdata = $this->_customdata['formdata'];
        // Create form object
        $mform = $this->_form;

        $context = \context_system::instance();

        $grade_letters = new \local_earlyalert\grade_letters();

        // add in blank filter option
        $options = $grade_letters->get_select_array();
        $options = array(0 => 'All') + $options;

        if (isset($formdata->course_id)) {
            $mform->addElement('header', 'early_alert_filter_grade_header', "Grade's for " . $formdata -> courses[$formdata->course_id], 'class="smaller-header"');
            $grade_select = $mform->addElement('select', 'early_alert_filter_grade_select', get_string('select_grade', 'local_earlyalert'), $options);
            $mform->addElement('advcheckbox', 'early_alert_filter_grade_chk', '', 'Show grades (temporary feature)', array('group' => 1), array(0, 1));
            $mform->addElement('static', 'description', get_string('student_list', 'local_earlyalert'),
                null);

            // Add a container element to hold the students list
            $mform->addElement('html', '<div id = "early_alert_filter_students_container">No records!</div>');

            // Hidden input field to hold the selected grade
            $mform->addElement('hidden', 'student_ids');
            $mform->addElement('hidden', 'early_alert_filter_course_id', $formdata->course_id);
            $grade_select->setSelected(9); // whichever is D+ which is ID:9

            $buttonarray=array();
            $buttonarray[] = $mform->createElement('button', 'early_alert_filter_preview_button', get_string('preview_email', 'local_earlyalert'));
            //$buttonarray[] = $mform->createElement('submit', 'early_alert_filter_save_button', get_string('send', 'local_earlyalert'), array('onclick' => 'window.location.href = \'dashboard.php?course_id=' . $formdata->course_id . '\';'));
            $buttonarray[] = $mform->createElement('submit', 'early_alert_filter_save_button', get_string('send', 'local_earlyalert'), array('onclick' => 'javascript:event.preventDefault()'));
            $mform->addGroup($buttonarray, 'buttonarray', '', ' ', false);
        }

    }

}
