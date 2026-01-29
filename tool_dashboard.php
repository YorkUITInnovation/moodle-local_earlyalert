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
 * Tools dashboard page showing available tools based on user capabilities.
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

// Load AMD module
//$PAGE->requires->js_call_amd('local_earlyalert/filter_students_grade', 'init');

/*if (!has_capability('local/earlyalert:instructor_dash_view', $PAGE->context, $USER->id)) {
    redirect($CFG->wwwroot . '/my');
}*/


echo base::page(
    new moodle_url('/local/earlyalert/tool_dashboard.php'),
    get_string('my_tools', 'local_earlyalert'),
    get_string('my_tools', 'local_earlyalert')
);
$data = new stdClass();
// Get all capabilites
if (has_capability('local/earlyalert:student_lookup', $context, $USER->id)) {
    $data->student_lookup = true;
}
if (has_capability('local/earlyalert:impersonate', $context, $USER->id) || helper::is_teacher()) {
    $data->impersonate = true;
}
if (has_capability('local/etemplate:view', $context, $USER->id)) {
    $data->etemplates = true;
}
if (has_capability('local/organization:unit_view', $context, $USER->id)) {
    $data->roles = true;
}
if (has_capability('local/earlyalert:view_reports', $context, $USER->id)) {
    $data->admin_report = true;
}
if (has_capability('local/earlyalert:view_advisor_reports', $context, $USER->id)) {
    $data->advisor_report = true;
}

$event = \local_earlyalert\event\earlyalert_viewed::create(array(
    'context' => \context_system::instance(),
    'relateduserid' => $USER->id
));
$event->trigger();

echo $OUTPUT->header();
echo $OUTPUT->render_from_template('local_earlyalert/tools_dashboard', $data);

echo $OUTPUT->footer();

