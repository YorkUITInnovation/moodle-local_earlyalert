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
 * Advisor reports dashboard.
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
if (!has_capability('local/earlyalert:view_reports', $context)) {
    if (!has_capability('local/earlyalert:view_advisor_reports', $context)) {
        redirect($CFG->wwwroot . '/my');
    }
}

echo base::page(
    new moodle_url('/local/earlyalert/report_advisor_dashboard.php'),
    get_string('advisor_reports', 'local_earlyalert'),
    get_string('advisor_reports', 'local_earlyalert'),
    $context,
    'standard'
);


$data = [
    'report_type' => 'advisor'
];


echo $OUTPUT->header();
echo $OUTPUT->render_from_template('local_earlyalert/react_report_dashboard', $data);

echo $OUTPUT->footer();

