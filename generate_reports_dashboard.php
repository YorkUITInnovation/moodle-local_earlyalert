<?php
require_once('../../config.php');
include_once('classes/tables/generated_reports_table.php');
include_once('classes/forms/generated_reports_filter_form.php');

use local_organization\base;
use local_organization\campus_table;

global $CFG, $OUTPUT, $PAGE, $DB, $USER;


require_login(1, false);

$context = context_system::instance();

if (!has_capability('local/earlyalert:edit_reports', $PAGE->context, $USER->id)) {
    redirect($CFG->wwwroot . '/my');
}

// Load AMD module
//$PAGE->requires->js_call_amd('local_organization/campuses', 'init');
// Load CSS file
//$PAGE->requires->css('/local/organization/css/general.css');

$term = optional_param('q', '', PARAM_TEXT);
$formdata = new stdClass();
$formdata->name = $term;

$mform = new \local_earlyalert\forms\generated_reports_filter_form(null, array('formdata' => $formdata));

if ($mform->is_cancelled()) {
    // Handle form cancel operation, if cancel button is present
    redirect($CFG->wwwroot . '/local/earlyalert/generated_reports.php');
} else if ($data = $mform->get_data()) {
    // Process validated data
    $term_filter = $data->q;
} else {
    // Display the form
//    $mform->display();
}

$table = new \local_earlyalert\tables\generated_reports_table('local_earlyalert_reports');
$params = array();
// Define the SQL query to fetch data
$sql = "id != 0";
if (!empty($term_filter)) {
    $sql .= " AND name LIKE '%$term_filter%'";
}

// Define the SQL query to fetch data
$table->set_sql('*', '{local_earlyalert_reports}', $sql);

// Define the base URL for the table
$table->define_baseurl(new moodle_url('/local/earlyalert/generated_reports.php'));

base::page(
    new moodle_url('/local/earlyalert/generated_reports.php'),
    get_string('generated_reports', 'local_earlyalert'),
    get_string('generated_reports', 'local_earlyalert')
);

echo $OUTPUT->header();
// Set up the table
$mform->display();
$table->out(20, true);
echo $OUTPUT->footer();

