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

base::page(
    new moodle_url('/local/earlyalert/dashboard.php'),
    get_string('idashboard', 'local_earlyalert'),
    get_string('idashboard', 'local_earlyalert')
);

// build a student / course / final grade array object
$student_grades = helper::get_moodle_grades($data);
//foreach($student_grades as $student) {
//    base::debug_to_console($student);
//}

// need to filter out instructors and other roles from result later!



// grade display with checkboxes form
//$grade_alert_form = new \local_earlyalert\forms\grades_form(null, array('formdata' => $student_grades));

echo $OUTPUT->header();
echo $OUTPUT->render_from_template('local_earlyalert/course_cards', $data);

//echo $OUTPUT->render_from_template('local_earlyalert/course_alerts', $student_grades);
if ($course_id) {
    // grade filter drop down render
    $grades_filter_form = new \local_earlyalert\forms\grades_filter(null, array('formdata' => $formdata));
    $grades_filter_form->display();

    if ($formdata = $grades_filter_form->get_data()) {
        // attach data to dom for table with checkbox and submit buttons
        base::debug_to_console('test select');
        $selected_value = $formdata->grade_select;
        base::debug_to_console($selected_value);
        // Do something with the selected value

    }
}
echo $OUTPUT->footer();

