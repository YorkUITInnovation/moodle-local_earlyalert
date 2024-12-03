<?php
global $CFG, $OUTPUT, $PAGE, $DB, $USER;
require_once("../../config.php");
require_once($CFG->libdir . "/externallib.php");

use local_earlyalert\base;
use local_earlyalert\helper;

require_login(1, false);

$context = context_system::instance();
// Load CSS
$PAGE->requires->css('/local/earlyalert/css/styles.css');
// Load AMD module
$PAGE->requires->js_call_amd('local_earlyalert/course_overview', 'init');

// get student courses

//TODO: remove me when implemented
redirect($CFG->wwwroot . '/my');


$course_id = optional_param('course_id', 0, PARAM_INT);
$user_id = optional_param('user_id', $USER->id, PARAM_INT);

if (!$courses = enrol_get_users_courses($user_id)) {
    base::debug_to_console('no course'); //add no course mustache message
}

$course_data = helper::get_courses_in_acadyear_by_row($courses);
// $course_data = [];
//print_object($course_data);

$course_data['student_id'] = $user_id;


echo base::page(
    new moodle_url('/local/earlyalert/student_dashboard.php'),
    get_string('my_courses', 'local_earlyalert'),
    get_string('my_courses', 'local_earlyalert')
);

echo $OUTPUT->header();
echo $OUTPUT->render_from_template('local_earlyalert/course_cards', $course_data);

echo $OUTPUT->footer();

