<?php
global $CFG, $OUTPUT, $PAGE, $DB, $USER;
require_once("../../config.php");

use local_earlyalert\base;
use local_earlyalert\helper;

require_login(1, false);

$context = context_system::instance();
// Check if user has access to early alert
if (!has_capability('local/earlyalert:access_early_alert', $context)) {
    redirect($CFG->wwwroot . '/my');
}

// Load AMD module
//$PAGE->requires->js_call_amd('local_earlyalert/filter_students_grade', 'init');

/*if (!has_capability('local/earlyalert:instructor_dash_view', $PAGE->context, $USER->id)) {
    redirect($CFG->wwwroot . '/my');
}*/


echo base::page(
    new moodle_url('/local/earlyalert/tool_dashboard.php'),
    get_string('my_tools', 'local_earlyalert'),
    get_string('my_tools', 'local_earlyalert')
);
$data = new stdClass();
// Get all capabilites
if (has_capability('local/earlyalert:student_lookup', $context, $USER->id)) {
    $data->student_lookup = true;
}
if (has_capability('local/earlyalert:impersonate', $context, $USER->id) || helper::is_teacher()) {
    $data->impersonate = true;
}
if (has_capability('local/etemplate:view', $context, $USER->id)) {
    $data->etemplates = true;
}
if (has_capability('local/organization:unit_view', $context, $USER->id)) {
    $data->roles = true;
}
if (has_capability('local/earlyalert:view_reports', $context, $USER->id)) {
    $data->reports = true;
}

echo $OUTPUT->header();
echo $OUTPUT->render_from_template('local_earlyalert/tools_dashboard', $data);

echo $OUTPUT->footer();

