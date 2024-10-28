<?php
global $CFG, $OUTPUT, $PAGE, $DB, $USER;
require_once("../../config.php");
require_once($CFG->libdir . "/externallib.php");
require_once("../../../html/course/externallib.php");
//require_once($CFG->dirroot . '/grade/querylib.php');
//require_once($CFG->dirroot . '/lib/grade/grade_item.php');

use local_earlyalert\base;


require_login(1, false);

$context = context_system::instance();

/*if (!has_capability('local/organization:unit_view', $PAGE->context, $USER->id)) {
    redirect($CFG->wwwroot . '/my');
}

// Load AMD module
$PAGE->requires->js_call_amd('local_organization/instructors', 'init');
*/
// Load CSS file
$PAGE->requires->css('/local/earlyalert/css/styles.css');
// Get the list of courses from Moodle API for the category year 2024
//$coursedata = \core_course_external::get_courses_by_field('category', '2');
if (!$courses = enrol_get_users_courses($USER->id)) {
    base::debug_to_console('no course');
}

$data[] = array();
//base::debug_to_console($coursedata);
$i=0;
foreach($courses as $course){
    base::debug_to_console($course->fullname);
    $data[$i] = $course;
    $i++;
}
// build a list of courses for the links

base::page(
    new moodle_url('/local/earlyalert/dashboard.php'),
    get_string('idashboard', 'local_earlyalert'),
    get_string('idashboard', 'local_earlyalert')
);

$courses = ["one", "two"];

echo $OUTPUT->header();
echo $OUTPUT->render_from_template('local_earlyalert/course_cards', $data);
echo $OUTPUT->footer();

