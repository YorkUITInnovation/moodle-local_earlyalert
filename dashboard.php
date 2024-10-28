<?php
global $CFG, $OUTPUT, $PAGE, $DB, $USER;
require_once("../../config.php");
require_once($CFG->libdir . "/externallib.php");

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
// Get the list of courses from Moodle API
$courses = get_courses_by_field('teacher', 'userid', $USER->id);

$data['courses'] = array();
foreach ($courses as $course) {
    $data['courses'][] = array(
        'name' => $course->fullname
//        'grades' => get_grades_for_course($course),
//        'assignments' => get_assignments_for_course($course),
    );
}

echo $OUTPUT->render_from_template('local_earlyalert/course_cards', $data['courses']);

base::page(
    new moodle_url('/local/earlyalert/dashboard.php'),
    get_string('idashboard', 'local_earlyalert'),
    get_string('idashboard', 'local_earlyalert')
);

echo $OUTPUT->header();

echo $OUTPUT->footer();

