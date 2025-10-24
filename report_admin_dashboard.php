<?php
global $CFG, $OUTPUT, $PAGE, $DB, $USER;
require_once("../../config.php");

use local_earlyalert\base;
use local_earlyalert\helper;

require_login(1, false);

$context = context_system::instance();
// Check if user has access to early alert
if (!has_capability('local/earlyalert:view_reports', $context)) {
    redirect($CFG->wwwroot . '/my');
}


echo base::page(
    new moodle_url('/local/earlyalert/report_admin_dashboard.php'),
    get_string('administrative_reports', 'local_earlyalert'),
    get_string('administrative_reports', 'local_earlyalert'),
    $context,
    'standard'
);


$data = [
    'report_type' => 'admin'
];


echo $OUTPUT->header();
echo $OUTPUT->render_from_template('local_earlyalert/react_report_dashboard', $data);

echo $OUTPUT->footer();

