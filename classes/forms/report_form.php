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

        $mform->addElement('header', 'build_query', get_string('build_query', 'local_earlyalert'));

        // Add a text area for the prompt
        $mform->addElement('textarea', 'prompt', get_string('prompt', 'local_earlyalert'));
        $mform->addHelpButton('prompt', 'prompt', 'local_earlyalert');
        $mform->setType('prompt', PARAM_TEXT);

        $mform->addElement('selectyesno', 'requires_course_field', get_string('requires_course_field', 'local_earlyalert'));
        $mform->setType('requires_course_field', PARAM_BOOL);
        $mform->addHelpButton('requires_course_field', 'requires_course_field', 'local_earlyalert');

        // Add a group for the two buttons: create query and preview results
        $buttonarray = array();
        $buttonarray[] = $mform->createElement('button', 'create_query', get_string('create_query', 'local_earlyalert'));
        $buttonarray[] = $mform->createElement('button', 'preview_results', get_string('preview_results', 'local_earlyalert'));
        $mform->addGroup($buttonarray, 'buttonar', '', array(' '), false);
        // Add a rule to hide preview_results unless sqlquery is not empty
        $mform->hideIf('preview_results', 'sqlquery', 'eq', '');

        $mform->addElement('textarea', 'sqlquery', get_string('sqlquery', 'local_earlyalert'));
        $mform->setType('sqlquery', PARAM_RAW);

        // Cohort (int, 2)
        $mform->addElement('select', 'cohort', get_string('role', 'local_earlyalert'), [0 => get_string('teachers', 'local_earlyalert'), 1 => get_string('advisors', 'local_earlyalert')]);
        $mform->setType('cohort', PARAM_INT);
        $mform->addHelpButton('cohort', 'role', 'local_earlyalert');

        $this->add_action_buttons();
    }
}

