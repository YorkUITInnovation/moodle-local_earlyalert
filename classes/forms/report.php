<?php
// This file is part of Moodle - https://moodle.org/

namespace local_earlyalert\forms;

use moodleform;

require_once($CFG->libdir.'/formslib.php');

class local_earlyalert_report_form extends moodleform {
    public function definition() {
        $formdata = $this->_customdata['formdata'];
        // Create form object
        $mform = $this->_form;

        // Hidden fields for usermodified, timecreated, timemodified, id
        $mform->addElement('hidden', 'id');
        $mform->setType('id', PARAM_INT);

        // Name (char, 255)
        $mform->addElement('text', 'name', get_string('name'));
        $mform->setType('name', PARAM_TEXT);
        $mform->addRule('name', null, 'required', null, 'client');

        // Description (text)
        $mform->addElement('editor', 'description_editor', get_string('description'));
        $mform->setType('description', PARAM_TEXT);

        $mform->addElement('textarea', 'sqlquery', get_string('sqlquery', 'local_earlyalert'));
        $mform->setType('sqlquery', PARAM_RAW);

        // Cohort (int, 2)
        $mform->addElement('select', 'cohort', get_string('cohort', 'local_earlyalert'), [0 => get_string('teachers', 'local_earlyalert'), 1 => get_string('advisors', 'local_earlyalert')]);
        $mform->setType('cohort', PARAM_INT);

        $this->add_action_buttons();
    }
}

