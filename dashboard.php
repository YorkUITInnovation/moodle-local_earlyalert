<?php
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Instructor dashboard for raising early alerts.
 *
 * @package     local_earlyalert
 * @copyright   2024 York University <itinnovation@yorku.ca>
 * @license     https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once("../../config.php");

global $CFG, $OUTPUT, $PAGE, $DB, $USER;

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
// Load AMD module.
$PAGE->requires->js_call_amd('local_earlyalert/filter_students_grade', 'init');


$impersonate = has_capability('local/earlyalert:impersonate', $context, $USER->id);
$teacher = helper::is_teacher();
$student = helper::is_student();

//if ($student) {
//    redirect($CFG->wwwroot . '/my');
//}
// rebuild 2
if (!$impersonate && (!$teacher || is_siteadmin($USER->id))) {
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
    // When impersonating, keep $user_id as the impersonated user's ID
} else {
    // When not impersonating, use the logged-in user's ID
    $user_id = $USER->id;
}

$show_grades = $CFG->earlyalert_showgrades;

if ($teacher || $is_impersonating) {
    $show_active_only = !empty($CFG->earlyalert_showactivecourses);
    $courses = enrol_get_users_courses($user_id, ['onlyactive' => $show_active_only]);
    if (empty($courses)) {
        $courses = [];
        base::debug_to_console('no course'); //add no course mustache message
    }
}
// build a list of courses for the links
if ($teacher || $is_impersonating) {
    $course_data = helper::get_courses_in_acadyear_by_row($courses);
} else {
    $course_data = [];
}

$dashboarddata = [
    'show_grades' => !empty($CFG->earlyalert_showgrades),
    'teacher_user_id' => $user_id,
    'impersonate' => false,
    'courses' => [],
    'has_courses' => false,
    'metric_total_alerts' => 0,
    'metric_students_at_risk' => 0,
    'metric_pending_actions' => 0,
];

$dashboarddata['strings'] = [
    'impersonate_user' => get_string('impersonate_user', 'local_earlyalert'),
    'course_list' => get_string('course_list', 'local_earlyalert'),
    'earlyalert_dashboard_title' => get_string('earlyalert_dashboard_title', 'local_earlyalert'),
    'earlyalert_dashboard_subtitle' => get_string('earlyalert_dashboard_subtitle', 'local_earlyalert'),
    'metric_total_alerts' => get_string('metric_total_alerts', 'local_earlyalert'),
    'metric_students_at_risk' => get_string('metric_students_at_risk', 'local_earlyalert'),
    'metric_pending_actions' => get_string('metric_pending_actions', 'local_earlyalert'),
    'active_courses' => get_string('active_courses', 'local_earlyalert'),
    'course_code_title' => get_string('course_code_title', 'local_earlyalert'),
    'enrollment' => get_string('enrollment', 'local_earlyalert'),
    'alerts_term' => get_string('alerts_term', 'local_earlyalert'),
    'risk_level' => get_string('risk_level', 'local_earlyalert'),
    'actions' => get_string('actions', 'core'),
    'start_alert_flow' => get_string('start_alert_flow', 'local_earlyalert'),
    'no_courses' => get_string('no_courses', 'local_earlyalert'),
    'send_early_alert' => get_string('send_early_alert', 'local_earlyalert'),
    'back_to_dashboard' => get_string('back_to_dashboard', 'local_earlyalert'),
    'alert_type' => get_string('alert_type', 'local_earlyalert'),
    'grade_threshold_and_students' => get_string('grade_threshold_and_students', 'local_earlyalert'),
    'compose_and_send' => get_string('compose_and_send', 'local_earlyalert'),
    'choose_alert_type' => get_string('choose_alert_type', 'local_earlyalert'),
    'choose_alert_type_help' => get_string('choose_alert_type_help', 'local_earlyalert'),
    'selected_alert_type' => get_string('selected_alert_type', 'local_earlyalert'),
    'low_grade' => get_string('low_grade', 'local_earlyalert'),
    'alert_type_low_grade_help' => get_string('alert_type_low_grade_help', 'local_earlyalert'),
    'missed_assignment' => get_string('missed_assignment', 'local_earlyalert'),
    'alert_type_assignment_help' => get_string('alert_type_assignment_help', 'local_earlyalert'),
    'missed_exam' => get_string('missed_exam', 'local_earlyalert'),
    'alert_type_exam_help' => get_string('alert_type_exam_help', 'local_earlyalert'),
    'alert_type_commendation' => get_string('alert_type_commendation', 'local_earlyalert'),
    'alert_type_commendation_help' => get_string('alert_type_commendation_help', 'local_earlyalert'),
    'continue' => get_string('continue'),
    'alert_criteria' => get_string('alert_criteria', 'local_earlyalert'),
    'filter_on' => get_string('filter_on', 'local_earlyalert'),
    'grade_items' => get_string('grade_items', 'local_earlyalert'),
    'grade_items_help' => get_string('grade_items_help', 'local_earlyalert'),
    'matched_items' => get_string('matched_items', 'local_earlyalert'),
    'overall_course_grade' => get_string('overall_course_grade', 'local_earlyalert'),
    'single_assignment_quiz' => get_string('single_assignment_quiz', 'local_earlyalert'),
    'multi_assignments_quizzes' => get_string('multi_assignments_quizzes', 'local_earlyalert'),
    'multi_mode' => get_string('multi_mode', 'local_earlyalert'),
    'multi_mode_any' => get_string('multi_mode_any', 'local_earlyalert'),
    'multi_mode_average' => get_string('multi_mode_average', 'local_earlyalert'),
    'multi_mode_weighted' => get_string('multi_mode_weighted', 'local_earlyalert'),
    'select_grade_item' => get_string('select_grade_item', 'local_earlyalert'),
    'select_grade_items' => get_string('select_grade_items', 'local_earlyalert'),
    'condition' => get_string('condition', 'local_earlyalert'),
    'condition_locked_help' => get_string('condition_locked_help', 'local_earlyalert'),
    'condition_below' => get_string('condition_below', 'local_earlyalert'),
    'condition_above' => get_string('condition_above', 'local_earlyalert'),
    'condition_missing' => get_string('condition_missing', 'local_earlyalert'),
    'threshold' => get_string('threshold', 'local_earlyalert'),
    'threshold_mode_letter' => get_string('threshold_mode_letter', 'local_earlyalert'),
    'threshold_mode_percent' => get_string('threshold_mode_percent', 'local_earlyalert'),
    'threshold_help' => get_string('threshold_help', 'local_earlyalert'),
    'apply_filter' => get_string('apply_filter', 'local_earlyalert'),
    'flagged_students' => get_string('flagged_students', 'local_earlyalert'),
    'selected' => get_string('selected', 'local_earlyalert'),
    'clear_selection' => get_string('clear_selection', 'local_earlyalert'),
    'export_csv' => get_string('export_csv', 'local_earlyalert'),
    'showing_range_default' => get_string('showing_range_default', 'local_earlyalert'),
    'search_students' => get_string('search_students', 'local_earlyalert'),
    'not_using_gradebook' => get_string('not_using_gradebook', 'local_earlyalert'),
    'items_per_page' => get_string('items_per_page', 'local_earlyalert'),
    'go_to_page' => get_string('go_to_page', 'local_earlyalert'),
    'of_pages' => get_string('of_pages', 'local_earlyalert', '{total}'),
    'search' => get_string('search'),
    'student_name' => get_string('student_name', 'local_earlyalert'),
    'student_id' => get_string('student_id', 'local_earlyalert'),
    'grade' => get_string('grade', 'local_earlyalert'),
    'preview' => get_string('preview', 'local_earlyalert'),
    'loading' => get_string('loading', 'local_earlyalert'),
    'previous' => get_string('previous'),
    'next' => get_string('next'),
    'compose_message' => get_string('compose_message', 'local_earlyalert'),
    'additional_message' => get_string('additional_message', 'local_earlyalert'),
    'additional_message_help' => get_string('additional_message_help', 'local_earlyalert'),
    'etemplate_template_note' => get_string('etemplate_template_note', 'local_earlyalert'),
    'message_template' => get_string('message_template', 'local_earlyalert'),
    'subject_line' => get_string('subject_line', 'local_earlyalert'),
    'message_body' => get_string('message_body', 'local_earlyalert'),
    'available_tokens' => get_string('available_tokens', 'local_earlyalert'),
    'sample_preview_note' => get_string('sample_preview_note', 'local_earlyalert'),
    'resolved_preview' => get_string('resolved_preview', 'local_earlyalert'),
    'resolved_preview_note' => get_string('resolved_preview_note', 'local_earlyalert'),
    'reset_to_template' => get_string('reset_to_template', 'local_earlyalert'),
    'custom_message_button_label' => get_string('custom_message_button_label', 'local_earlyalert'),
    'compose_help_text' => get_string('compose_help_text', 'local_earlyalert'),
    'preview_email' => get_string('preview_email', 'local_earlyalert'),
    'message_preview' => get_string('message_preview', 'local_earlyalert'),
    'to_label' => get_string('to_label', 'local_earlyalert'),
    'close' => get_string('close', 'local_earlyalert'),
    'preview_message_placeholder' => get_string('preview_message_placeholder', 'local_earlyalert'),
    'back' => get_string('back'),
    'send_alert_now' => get_string('send_alert_now', 'local_earlyalert'),
];

// Ensure teacher_user_id is always set regardless of the course data structure
$course_data['teacher_user_id'] = $user_id;

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
    $dashboarddata['impersonate'] = true;
}

// Debug: Let's see what's actually in course_data when it's passed to the template
// Uncomment the next line to debug
// error_log('Course data passed to template: ' . print_r($course_data, true));

// Set is_selected property for the selected course
if (!empty($course_data['rows']) && $course_id) {
    foreach ($course_data['rows'] as &$row) {
        foreach ($row['courses'] as &$course) {
            $course->is_selected = ($course->id == $course_id);
            // Check if course has students when a course is selected (for showing/hiding the results card)
            if ($course->id == $course_id) {
                // Just check if any students are enrolled (don't load full data - that's done via AJAX)
                $enrolled_users = get_enrolled_users(context_course::instance($course_id), 'mod/assign:submit', 0, 'u.id', null, 0, 0, true);
                $has_students = false;
                foreach ($enrolled_users as $user) {
                    if (!has_capability('moodle/course:update', context_course::instance($course_id), $user->id)) {
                        $has_students = true;
                        break; // Found at least one student, no need to continue
                    }
                }
                $course_data['has_students'] = $has_students;
            }
        }
    }
    unset($row); // break reference
    unset($course);
}

if (!empty($course_data['rows'])) {
    $courseids = [];
    foreach ($course_data['rows'] as $row) {
        foreach ($row['courses'] as $course) {
            $courseids[] = (int)$course->id;
        }
    }

    $coursealertcounts = [];
    if (!empty($courseids)) {
        list($insql, $inparams) = $DB->get_in_or_equal($courseids, SQL_PARAMS_NAMED, 'cid');
        $params = $inparams + ['instructorid' => $user_id];
        $sql = "SELECT course_id,
                       COUNT(1) AS totalalerts,
                       SUM(CASE WHEN student_advised_by_instructor = 0 THEN 1 ELSE 0 END) AS pendingalerts
                  FROM {local_earlyalert_report_log}
                 WHERE instructor_id = :instructorid
                   AND course_id {$insql}
              GROUP BY course_id";
        $records = $DB->get_records_sql($sql, $params);
        foreach ($records as $record) {
            $coursealertcounts[(int)$record->course_id] = [
                'total' => (int)$record->totalalerts,
                'pending' => (int)$record->pendingalerts,
            ];
        }
    }

    foreach ($course_data['rows'] as $row) {
        foreach ($row['courses'] as $course) {
            $coursecontext = context_course::instance($course->id);
            $enrollment = (int)count_enrolled_users($coursecontext, 'mod/assign:submit');
            $alertsforcourse = $coursealertcounts[$course->id]['total'] ?? 0;
            $pendingforcourse = $coursealertcounts[$course->id]['pending'] ?? 0;
            $ratio = $enrollment > 0 ? ($alertsforcourse / $enrollment) : 0;

            $risklevel = get_string('risk_low', 'local_earlyalert');
            $riskbadge = 'success';
            if ($ratio >= 0.15) {
                $risklevel = get_string('risk_high', 'local_earlyalert');
                $riskbadge = 'danger';
            } else if ($ratio >= 0.08) {
                $risklevel = get_string('risk_moderate', 'local_earlyalert');
                $riskbadge = 'warning';
            }

            $dashboarddata['courses'][] = [
                'id' => (int)$course->id,
                'fullname' => format_string($course->fullname),
                'enrollment' => $enrollment,
                'alerts' => $alertsforcourse,
                'pending' => $pendingforcourse,
                'risklevel' => $risklevel,
                'riskbadge' => $riskbadge,
                'courseurl' => (new moodle_url('/course/view.php', ['id' => $course->id]))->out(false),
            ];
        }
    }

    $dashboarddata['has_courses'] = !empty($dashboarddata['courses']);
}

$dashboarddata['metric_total_alerts'] = (int)$DB->count_records('local_earlyalert_report_log', ['instructor_id' => $user_id]);
$dashboarddata['metric_pending_actions'] = (int)$DB->count_records_select(
    'local_earlyalert_report_log',
    'instructor_id = :instructorid AND student_advised_by_instructor = 0',
    ['instructorid' => $user_id]
);
$dashboarddata['metric_students_at_risk'] = (int)$DB->count_records_sql(
    "SELECT COUNT(DISTINCT target_user_id)
       FROM {local_earlyalert_report_log}
      WHERE instructor_id = :instructorid
        AND student_advised_by_instructor = 0",
    ['instructorid' => $user_id]
);

if ($teacher || $is_impersonating) {
    $course_data_for_grades = [];
    $i = 0;
    // Prepare course data fro grades
    if (!empty($course_data) && array_key_exists('rows', $course_data)) {
        for ($x = 0; $x < count($course_data['rows']); $x++) {
            foreach ($course_data['rows'][$x]['courses'] as $course) {
                $course_data_for_grades[$x] = $course;
                $i++;
            }
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
    get_string('earlyalert_dashboard_title', 'local_earlyalert'),
    ''
);

$event = \local_earlyalert\event\earlyalert_viewed::create(array(
    'context' => \context_system::instance(),
    'relateduserid' => $USER->id
));
$event->trigger();

echo $OUTPUT->header();
echo $OUTPUT->render_from_template('local_earlyalert/course_cards', $dashboarddata);
echo $OUTPUT->footer();
