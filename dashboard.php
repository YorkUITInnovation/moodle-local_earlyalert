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
// Load CSS
$PAGE->requires->css('/local/earlyalert/css/styles.css');
// Load AMD module
$PAGE->requires->js_call_amd('local_earlyalert/filter_students_grade', 'init');
$PAGE->requires->js_call_amd('local_earlyalert/course_overview', 'init');


$impersonate = has_capability('local/earlyalert:impersonate', $context, $USER->id);
$teacher = helper::is_teacher();
$student = helper::is_student();

//if ($student) {
//    redirect($CFG->wwwroot . '/my');
//}
// rebuild
if (!$impersonate || !$teacher) {
    redirect($CFG->wwwroot . '/my');
}

// Get the list of courses from Moodle API for the category year 2024
//$coursedata = \core_course_external::get_courses_by_field('category', '2');

$course_id = optional_param('course_id', 0, PARAM_INT);
$alert_type = optional_param('alert_type', '', PARAM_TEXT);
$grade_letter_id = optional_param('grade_letter_id', '', PARAM_TEXT);
$user_id = optional_param('user_id', $USER->id, PARAM_INT);

$is_impersonating = false;
$impersonated_user = new stdClass();
if ($user_id != $USER->id) {
    $is_impersonating = true;
    $impersonated_user = $DB->get_record('user', ['id' => $user_id]);
} else {
    $user_id = $USER->id;
}

$show_grades = $CFG->earlyalert_showgrades;

if ($teacher || $is_impersonating) {
    if (!$courses = enrol_get_users_courses($user_id)) {
        base::debug_to_console('no course'); //add no course mustache message
    }
}
// build a list of courses for the links
if ($teacher || $is_impersonating) {
    $course_data = helper::get_courses_in_acadyear_by_row($courses);
} else {
    $course_data = [];
}

// Add impersonting user name to $course_data if $is_impersonating is true
if ($is_impersonating) {
    $course_data['impersonated_user'] = $impersonated_user->firstname . ' ' . $impersonated_user->lastname;
}
//print_object($course_data);
// Add course_id to $course_data if $course_id is not 0
if ($course_id) {
    $course_data['course_id'] = $course_id;
}
// Ad alert_type to $course_data if $alert_type is not empty
if ($alert_type) {
    $course_data['alert_type'] = $alert_type;
}
// Add show_grades to $course_data if $show_grades is not empty
if ($show_grades) {
    $course_data['show_grades'] = $show_grades;
}
if ($impersonate) {
    $course_data['impersonate'] = true;
}

$course_data['teacher_user_id'] = $user_id;

if ($teacher || $is_impersonating) {
    $course_data_for_grades = [];
// Prepare course data fro grades
    $i = 0;
    for ($x = 0; $x < count($course_data['rows']); $x++) {
        foreach ($course_data['rows'][$x]['courses'] as $course) {
            $course_data_for_grades[$i] = $course;
            $i++;
        }
    }

// get course names and ids
    $course_data_for_display = [];
    foreach ($course_data_for_grades as $c) {
        $course_data_for_display[$c->id] = $c->fullname;
    }
}

echo base::page(
    new moodle_url('/local/earlyalert/dashboard.php'),
    get_string('my_courses', 'local_earlyalert'),
    get_string('my_courses', 'local_earlyalert')
);

$event = \local_earlyalert\event\earlyalert_viewed::create(array(
    'context' => \context_system::instance(),
    'relateduserid' => $USER->id
));
$event->trigger();

echo $OUTPUT->header();
echo $OUTPUT->render_from_template('local_earlyalert/course_cards', $course_data);

echo $OUTPUT->footer();

