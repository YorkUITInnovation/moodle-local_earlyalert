<?php

namespace local_earlyalert\tables;

require_once('../../config.php');
require_once($CFG->libdir . '/tablelib.php');


class grade_table extends \table_sql
{

    protected $showDelButtons = false;
    /**
     * grade_table constructor.
     * @param $uniqueid
     */
    public function __construct($uniqueid)
    {
        GLOBAL $USER;
        parent::__construct($uniqueid);

        // Define the columns to be displayed
        $columns = array('action', 'lastname', 'grade','attended');
        $this->define_columns($columns);

        // Define the headers for the columns
        $headers = array(
            '',
            get_string('firstname', 'local_earlyalert'),
            get_string('lastname', 'local_earlyalert'),
            get_string('attended', 'local_earlyalert')
        );

        //Capabilities
        $system_context = \context_system::instance();
        /*if (has_capability('local/organization:unit_delete', $system_context, $USER->id)) {
            $this->showDelButtons = true;
        }
        */
        $this->define_headers($headers);
    }

    /**
     * Function to define the actions column
     *
     * @param $values
     * @return string
     */
    public function col_actions($values)
    {
        global $OUTPUT, $DB, $USER;

        $actions = [
            'id' => $values->id
            //'showDelButtons' => $this->showDelButtons
        ];

        return $OUTPUT->render_from_template('local_earlyalert/course_action_buttons', $actions);
    }
}