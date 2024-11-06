<?php
global $CFG, $OUTPUT, $PAGE, $DB, $USER;
require_once("../../config.php");
require_once($CFG->libdir . "/externallib.php");
//require_once("../../../html/course/externallib.php");
require_once("../../../html/enrol/externallib.php");
require_once("classes/forms/grades_form.php");
require_once("classes/forms/grades_filter.php");
//require_once($CFG->dirroot . '/lib/enrollib.php');


use local_earlyalert\base;
use local_earlyalert\helper;
require_login(1, false);

$context = context_system::instance();
// Load AMD module
$PAGE->requires->js_call_amd('local_earlyalert/filter_students_grade', 'init');
//$PAGE->requires->js_call_amd('local_earlyalert/preview_student_email', 'init');
$PAGE->requires->css('/local/earlyalert/css/gradeform.css');
/*if (!has_capability('local/earlyalert:instructor_dash_view', $PAGE->context, $USER->id)) {
    redirect($CFG->wwwroot . '/my');
}*/

// Load CSS file
$PAGE->requires->css('/local/earlyalert/css/styles.css');
// Get the list of courses from Moodle API for the category year 2024
//$coursedata = \core_course_external::get_courses_by_field('category', '2');

$course_id = optional_param('course_id', '', PARAM_INT);
$formdata = new stdClass();
$formdata -> course_id = $course_id;

if (!$courses = enrol_get_users_courses($USER->id)) {
    base::debug_to_console('no course');
}
// build a list of courses for the links
$data = helper::get_courses_in_acadyear($courses);

// get course names and ids
$course_data_for_display = [];
foreach($courses as $c) {
    $course_data_for_display[$c->id] = $c->fullname;
}
$formdata -> courses = $course_data_for_display;

// build a student / course / final grade array object
$student_grades = helper::get_moodle_grades($data);
//foreach($student_grades as $student) {
//    base::debug_to_console($student);
//}


echo $OUTPUT->header();
echo $OUTPUT->render_from_template('local_earlyalert/course_cards', $data);
$grades_filter_form = new \local_earlyalert\forms\grades_filter(null, array('formdata' => $formdata));

if ($course_id) {
    // grade filter drop down render
    $grades_filter_form->display();
    if ($grades_filter_form->is_validated())
    {
        $data = $grades_filter_form->get_data();
        // Get the value of the hidden field (e.g., 'student_ids')
        $studentIds = $data->student_ids;
        // Use to send emails
        base::debug_to_console($studentIds);
    }
}

//echo $OUTPUT->single_button('test', get_string('delete'), 'get', [
//    'data-modal' => 'modal',
//    'data-modal-title-str' => json_encode(['delete', 'core']),
//    'data-modal-content-str' => json_encode(['areyousure']),
//    'data-modal-yes-button-str' => json_encode(['delete', 'core'])
//]);
base::page(
    new moodle_url('/local/earlyalert/dashboard.php'),
    get_string('idashboard', 'local_earlyalert'),
    get_string('idashboard', 'local_earlyalert')
);

echo $OUTPUT->footer();

