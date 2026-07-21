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
 * Plugin upgrade steps are defined here.
 *
 * @package     local_earlyalert
 * @category    upgrade
 * @copyright   2024 York University <itinnovation@yorku.ca>
 * @license     https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Execute local_earlyalert upgrade from the given old version.
 *
 * @param int $oldversion
 * @return bool
 */
function xmldb_local_earlyalert_upgrade($oldversion) {
    global $DB;

    $dbman = $DB->get_manager();

    if ($oldversion < 2024112506) {

        // Changing type of field body on table local_earlyalert_report_log to text.
        $table = new xmldb_table('local_earlyalert_report_log');
        $field = new xmldb_field('body', XMLDB_TYPE_TEXT, null, null, null, null, null, 'subject');

        // Launch change of type for field body.
        $dbman->change_field_type($table, $field);

        // Earlyalert savepoint reached.
        upgrade_plugin_savepoint(true, 2024112506, 'local', 'earlyalert');
    }

    if ($oldversion < 2024112615) {

        // Changing type of field body on table local_earlyalert_report_log to text.
        $table = new xmldb_table('local_earlyalert_report_log');

    	// Remove facultyspecific_text_id key
        $key = new xmldb_key('fk_facultyspecific_text_id', XMLDB_KEY_UNIQUE, ['facultyspecific_text_id'], '');
        $dbman->drop_key($table, $key);

        // Remove body field
        $field = new xmldb_field('body', XMLDB_TYPE_TEXT, null, null, null, null, null, 'subject');
        if ($dbman->field_exists($table, $field)) {
            $dbman->drop_field($table, $field);
        }

        // Remove subject field
        $field = new xmldb_field('subject', XMLDB_TYPE_TEXT, null, null, null, null, null, 'target_user_id');
        if ($dbman->field_exists($table, $field)) {
            $dbman->drop_field($table, $field);
        }

        // Remove subject field
        $field = new xmldb_field('subject', XMLDB_TYPE_TEXT, null, null, null, null, null, 'target_user_id');
        if ($dbman->field_exists($table, $field)) {
            $dbman->drop_field($table, $field);
        }

        // Remove unit_id field
        $field = new xmldb_field('unit_id', XMLDB_TYPE_INTEGER, null, null, null, null, null, null);
        if ($dbman->field_exists($table, $field)) {
            $dbman->drop_field($table, $field);
        }

        // Remove department_id field
        $field = new xmldb_field('department_id', XMLDB_TYPE_INTEGER, null, null, null, null, null, null);
        if ($dbman->field_exists($table, $field)) {
            $dbman->drop_field($table, $field);
        }

        // Remove facultyspecific_text_id field
        $field = new xmldb_field('facultyspecific_text_id', XMLDB_TYPE_INTEGER, null, null, null, null, null, null);
        if ($dbman->field_exists($table, $field)) {
            $dbman->drop_field($table, $field);
        }

        // Remove actual_grade_letter field
        $field = new xmldb_field('actual_grade_letter', XMLDB_TYPE_CHAR, null, null, null, null, null, null);
        if ($dbman->field_exists($table, $field)) {
            $dbman->drop_field($table, $field);
        }

        // Remove trigger_grade_letter field
        $field = new xmldb_field('trigger_grade_letter', XMLDB_TYPE_CHAR, null, null, null, null, null, null);
        if ($dbman->field_exists($table, $field)) {
            $dbman->drop_field($table, $field);
        }

        // Earlyalert savepoint reached.
        upgrade_plugin_savepoint(true, 2024112615, 'local', 'earlyalert');
    }

    if ($oldversion < 2024112620) {

        // converting assignment_id to assignment_name
        $table = new xmldb_table('local_earlyalert_report_log');
        $field = new xmldb_field('assignment_id', XMLDB_TYPE_INTEGER, null, null, null, null, null, 'instructor_id');
        if ($dbman->field_exists($table, $field)) {
            $dbman->drop_field($table, $field);
        }
        $field = new xmldb_field('assignment_name', XMLDB_TYPE_CHAR, 255, null, null, null, null, 'instructor_id');
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Earlyalert savepoint reached.
        upgrade_plugin_savepoint(true, 2024112620, 'local', 'earlyalert');
    }
    if ($oldversion < 2024112621) {

	//splitting student_advised into student_advised_by_advisor and student_advised_by_instructor
        $table = new xmldb_table('local_earlyalert_report_log');
        $field = new xmldb_field('student_advised', XMLDB_TYPE_INTEGER, null, null, null, null, null, 'actual_grade');
        if ($dbman->field_exists($table, $field)) {
            $dbman->drop_field($table, $field);
        }
        $field = new xmldb_field('student_advised_by_advisor', XMLDB_TYPE_INTEGER, 10, null, null, null, null, 'actual_grade');
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }
        $field = new xmldb_field('student_advised_by_instructor', XMLDB_TYPE_INTEGER, 10, null, null, null, null, 'student_advised_by_advisor');
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Earlyalert savepoint reached.
        upgrade_plugin_savepoint(true, 2024112621, 'local', 'earlyalert');
    }

    if ($oldversion < 20250828003) {

        // Define field custom_message to be added to local_earlyalert_report_log.
        $table = new xmldb_table('local_earlyalert_report_log');
        $field = new xmldb_field('custom_message', XMLDB_TYPE_TEXT, null, null, null, null, null, 'student_advised_by_instructor');

        // Conditionally launch add field custom_message.
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Earlyalert savepoint reached.
        upgrade_plugin_savepoint(true, 20250828003, 'local', 'earlyalert');
    }
    if ($oldversion < 20251000001) {

        // Define field student_profile to be added to local_earlyalert_report_log.
        $table = new xmldb_table('local_earlyalert_report_log');
        $field = new xmldb_field('student_profile', XMLDB_TYPE_TEXT, null, null, null, null, null, 'custom_message');

        // Conditionally launch add field student_profile.
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Earlyalert savepoint reached.
        upgrade_plugin_savepoint(true, 20251000001, 'local', 'earlyalert');
    }

    if ($oldversion < 2026012900) {
        // Moodle 5.1 compatibility upgrade.
        // No database changes required, but marking upgrade point for compatibility updates.
        upgrade_plugin_savepoint(true, 2026012900, 'local', 'earlyalert');
    }

    if ($oldversion < 20260720001) {

        // Define send-time message snapshot fields to be added to local_earlyalert_report_log.
        $table = new xmldb_table('local_earlyalert_report_log');

        $field = new xmldb_field('student_profile', XMLDB_TYPE_TEXT, null, null, null, null, null, 'date_message_sent');
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        $field = new xmldb_field('custom_message', XMLDB_TYPE_TEXT, null, null, null, null, null, 'student_profile');
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        $field = new xmldb_field('subjectjson', XMLDB_TYPE_TEXT, null, null, null, null, null, 'student_profile');
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        $field = new xmldb_field('messagejson', XMLDB_TYPE_TEXT, null, null, null, null, null, 'subjectjson');
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Earlyalert savepoint reached.
        upgrade_plugin_savepoint(true, 20260720001, 'local', 'earlyalert');
    }

    if ($oldversion < 20260720002) {

        // Define threshold context fields to be added to local_earlyalert_report_log.
        $table = new xmldb_table('local_earlyalert_report_log');

        $field = new xmldb_field('threshold_mode', XMLDB_TYPE_CHAR, '20', null, null, null, null, 'trigger_grade');
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        $field = new xmldb_field('threshold_percent', XMLDB_TYPE_NUMBER, '10,2', null, null, null, null, 'threshold_mode');
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Earlyalert savepoint reached.
        upgrade_plugin_savepoint(true, 20260720002, 'local', 'earlyalert');
    }

    if ($oldversion < 20260720003) {

        // Define snapshot status field to be added to local_earlyalert_report_log.
        $table = new xmldb_table('local_earlyalert_report_log');

        $field = new xmldb_field('snapshot_status', XMLDB_TYPE_CHAR, '20', null, null, null, null, 'messagejson');
        if (!$dbman->field_exists($table, $field)) {
            $dbman->add_field($table, $field);
        }

        // Earlyalert savepoint reached.
        upgrade_plugin_savepoint(true, 20260720003, 'local', 'earlyalert');
    }

    return true;
}
