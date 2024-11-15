<?php
global $CFG, $OUTPUT, $PAGE, $DB, $USER;
require_once("../../config.php");
require_once($CFG->libdir . "/externallib.php");
require_once("../../../html/enrol/externallib.php");


use local_earlyalert\base;
use local_earlyalert\helper;

require_login(1, false);

$context = context_system::instance();
// Load CSS
$PAGE->requires->css('/local/earlyalert/css/gradeform.css');
$PAGE->requires->css('/local/earlyalert/css/styles.css');
// Load AMD module
$PAGE->requires->js_call_amd('local_earlyalert/filter_students_grade', 'init');

/*if (!has_capability('local/earlyalert:instructor_dash_view', $PAGE->context, $USER->id)) {
    redirect($CFG->wwwroot . '/my');
}*/

// Get the list of courses from Moodle API for the category year 2024
//$coursedata = \core_course_external::get_courses_by_field('category', '2');

$course_id = optional_param('course_id', 0, PARAM_INT);
$alert_type = optional_param('alert_type', '', PARAM_TEXT);
$grade_letter_id = optional_param('grade_letter_id', '', PARAM_TEXT);

// get config settings
$config = get_config('local_earlyalert');
$show_grades = $CFG->earlyalert_showgrades;

$formdata = new stdClass();
$formdata->course_id = $course_id;

if (!$courses = enrol_get_users_courses($USER->id)) {
    base::debug_to_console('no course'); //add no course mustache message
}
// build a list of courses for the links
$course_data = helper::get_courses_in_acadyear_by_row($courses);
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
// Ad alert_type to $course_data if $alert_type is not empty

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
$formdata->courses = $course_data_for_display;

// build a student / course / final grade array object
$student_grades = helper::get_moodle_grades($course_data_for_grades);
//foreach($student_grades as $student) {
//    base::debug_to_console($student);
//}

echo base::page(
    new moodle_url('/local/earlyalert/dashboard.php'),
    get_string('my_courses', 'local_earlyalert'),
    get_string('my_courses', 'local_earlyalert')
);

echo $OUTPUT->header();
echo $OUTPUT->render_from_template('local_earlyalert/course_cards', $course_data);

//if ($course_id) {
//    // grade filter drop down render
//    $grades_filter_form->display();
//    if ($grades_filter_form->is_validated()) {
//        $data = $grades_filter_form->get_data();
//        // Get the value of the hidden field (e.g., 'student_ids')
//
//        $unit_dept = helper::get_unit_department_from_courseid($course_id); // based on course_code
//        base::debug_to_console('unit_dept ids: ' . $unit_dept);
//
//        $template_id = helper::get_template_from_unit_department($unit_dept->unitid, $unit_dept->departmentid); // based on course code / Unit/ Faculty
//        base::debug_to_console('template id found: ' . $template_id);
//
//        $student_user_ids = $data->student_ids;
//        // Use to send emails
//        base::debug_to_console('User ids now');
//        foreach ($student_user_ids as $userid) {
//            // send email
//            // show Confirmation of students sent ?
//            base::debug_to_console($userid);
////            email_processEmail($course -> id); // preview only
////            email_processEmail($student -> id); // sends email
//        }
//    } else if ($grades_filter_form->is_cancelled()) {
//        // preview
//        base::debug_to_console('Form is cancelled');
//    }
//}

echo $OUTPUT->footer();

