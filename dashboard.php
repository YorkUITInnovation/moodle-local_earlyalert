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
// Load CSS
$PAGE->requires->css('/local/earlyalert/css/gradeform.css');
$PAGE->requires->css('/local/earlyalert/css/styles.css');
/*if (!has_capability('local/earlyalert:instructor_dash_view', $PAGE->context, $USER->id)) {
    redirect($CFG->wwwroot . '/my');
}*/

// Get the list of courses from Moodle API for the category year 2024
//$coursedata = \core_course_external::get_courses_by_field('category', '2');

$course_id = optional_param('course_id', '', PARAM_INT);
$formdata = new stdClass();
$formdata -> course_id = $course_id;

if (!$courses = enrol_get_users_courses($USER->id)) {
    base::debug_to_console('no course'); //add no course mustache message
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

        $unit_dept = helper::get_unit_department_from_courseid($course_id); // based on course_code
        base::debug_to_console('unit_dept ids: '. $unit_dept);

        $template_id = helper::get_template_from_unit_department($unit_dept->unitid, $unit_dept->departmentid); // based on course code / Unit/ Faculty
        base::debug_to_console('template id found: '. $template_id);

        $student_user_ids = $data->student_ids;
        // Use to send emails
        base::debug_to_console('User ids now');
        foreach($student_user_ids as $userid) {
            // send email
            // show Confirmation of students sent ?
            base::debug_to_console($userid);
//            email_processEmail($course -> id); // preview only
//            email_processEmail($student -> id); // sends email
        }
    }
    else if ($grades_filter_form->is_cancelled()) {
        // preview
        base::debug_to_console('Form is cancelled');
    }
}

base::page(
    new moodle_url('/local/earlyalert/dashboard.php'),
    get_string('idashboard', 'local_earlyalert'),
    get_string('idashboard', 'local_earlyalert')
);

echo $OUTPUT->footer();

