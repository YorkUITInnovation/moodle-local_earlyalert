<?php

namespace local_earlyalert\forms;

use moodleform;

require_once("$CFG->libdir/formslib.php");

class generated_reports_filter_form extends moodleform
{
    public function definition()
    {
        global $USER;
        $formdata = $this->_customdata['formdata'];
        $mform = $this->_form;
        
        // Group the text input and submit button
        $mform->addGroup(array(
            $mform->createElement(
                'text',
                'q',
                get_string('name', 'local_earlyalert')
            ),
            $mform->createElement(
                'submit',
                'submitbutton',
                get_string('filter', 'local_earlyalert')
            ),
            $mform->createElement(
                'cancel',
                'resetbutton',
                get_string('reset', 'local_earlyalert')
            ),
            $mform->createElement(
                'button',
                'addreport',
                get_string('new', 'local_earlyalert'),
                array('onclick' => 'window.location.href = \'edit_report.php\';')
            )

        ), 'filtergroup', '', array(' '), false);

        $mform->setType('q', PARAM_NOTAGS);

        $this->set_data($formdata);
    }
}