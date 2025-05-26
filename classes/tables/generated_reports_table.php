<?php

namespace local_earlyalert\tables;

require_once('../../config.php');
require_once($CFG->libdir . '/tablelib.php');


class generated_reports_table extends \table_sql
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
        $columns = array('name', 'description', 'actions');
        $this->define_columns($columns);

        // Define the headers for the columns
        $headers = array(
            get_string('name', 'local_earlyalert'),
            get_string('description', 'local_earlyalert'),
            get_string('actions', 'local_earlyalert')
        );
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
        ];

        return $OUTPUT->render_from_template('local_earlyalert/reports_action_buttons', $actions);
    }
}