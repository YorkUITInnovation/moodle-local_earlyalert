<?php
global $CFG, $OUTPUT, $PAGE, $DB, $USER;
require_once("../../config.php");
require_once($CFG->libdir . "/externallib.php");

use local_earlyalert\base;
use local_earlyalert\helper;
use local_earlyalert\email_report_log;

require_login(1, false);
// Check if user has access to early alert
$context = context_system::instance();
if (!has_capability('local/earlyalert:access_early_alert', $context)) {
    redirect($CFG->wwwroot . '/my');
}

// Load AMD module
$PAGE->requires->js_call_amd('local_earlyalert/student_lookup', 'init');

$user_id = optional_param('user_id', 0, PARAM_INT);

$course_data = [];
if ($user_id) {
    if (!$courses = enrol_get_users_courses($user_id, ['onlyactive' => true])) {
        base::debug_to_console('no course'); //add no course mustache message
    }

    $course_data = helper::get_courses_in_acadyear_by_row($courses);
// Initialize an empty array to hold the combined courses
    $combined_courses = [];

// Loop through the original array and extract the courses
    foreach ($course_data['rows'] as $row) {
        foreach ($row['courses'] as $course) {
            $combined_courses['courses'][] = $course;
            // Get alerts for the course and user_id
            $alerts = $DB->get_records('local_earlyalert_report_log', ['course_id' => $course->id, 'target_user_id' => $user_id],'timecreated DESC', 'id');
            $i = 0;
            $data = [];
            foreach ($alerts as $alert) {
                $LOG = new email_report_log($alert->id);
                // Get full student record
                $student = $LOG->get_student();
                // Get teacher record
                $teacher = $LOG->get_instructor();

                // Build data object
                $data[$i] = new \stdClass();
                $data[$i]->id = $LOG->get_id();
                $data[$i]->message_type = $LOG->get_message_type();
                $data[$i]->user_read = $LOG->get_user_read();
                $data[$i]->trigger_grade = $LOG->get_trigger_grade_letter();
                $data[$i]->student_advised_by_advisor = $LOG->get_student_advised_by_advisor();
                $data[$i]->student_advised_by_instructor = $LOG->get_student_advised_by_instructor();
                $data[$i]->date_sent = $LOG->get_date_sent();
                $data[$i]->grade = $LOG->get_actual_grade();
                $data[$i]->major = $student->major;
                $data[$i]->teacher_firstname = $teacher->firstname;
                $data[$i]->teacher_lastname = $teacher->lastname;
                $data[$i]->teacher_email = $teacher->email;
                unset($LOG);
                $i++;
            }
            $course->alerts = $data;
            $course->has_alerts = count($alerts) > 0;
        }
    }
    $student = $DB->get_record('user', ['id' => $user_id], 'id,firstname,lastname,email,idnumber', MUST_EXIST);
    $combined_courses['userid']= $student->id;
    $combined_courses['firstname']= $student->firstname;
    $combined_courses['lastname']= $student->lastname;
    $combined_courses['email']= $student->email;
    $combined_courses['idnumber']= $student->idnumber;
}

echo base::page(
    new moodle_url('/local/earlyalert/student_lookup.php'),
    get_string('student_lookup', 'local_earlyalert'),
    get_string('student_lookup', 'local_earlyalert')
);

$event = \local_earlyalert\event\earlyalert_viewed::create(array(
    'context' => \context_system::instance(),
    'relateduserid' => $USER->id
));
$event->trigger();

echo $OUTPUT->header();
echo $OUTPUT->render_from_template('local_earlyalert/student_lookup', $combined_courses);

echo $OUTPUT->footer();

