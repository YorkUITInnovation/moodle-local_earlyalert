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
 * Plugin strings are defined here.
 *
 * @package     local_earlyalert
 * @category    string
 * @copyright   2024 York University <itinnovation@yorku.ca>
 * @license     https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$string['pluginname'] = 'Early Alert';
$string['adashboard'] = 'Admin Dashboard';
$string['adjust_default_grade'] = 'Adjust Default Grade';
$string['available_alert_types'] = 'Available alert types';
$string['idashboard'] = 'Instructor Dashboard';
$string['low_grade'] = 'Low grade';
$string['missed_assignment'] = 'Missed Assignment';
$string['missed_exam'] = 'Missed Exam';
$string['my_courses'] = 'My Courses';
$string['my_list_of_students'] = 'My List of Students';
$string['name'] = 'Name';
$string['select_grade'] = 'Default Grade';
$string['select_students'] ='Select the students to whom you would like a {$a} alert to be sent by using the checkbox(es) below.<br><br>
You can preview the message by clicking on the “preview” button prior to sending.
';
$string['preview_email'] = 'Preview';
$string['send'] = 'Send';
$string['grade'] = 'Grade';
$string['preview'] = 'Preview';
$string['selected_alert_based_on'] = 'You are selecting an alert based on a';
$string['send_alert_based_on'] = 'Send an alert based on';
$string['student_list'] = 'LIST OF STUDENTS:  IDNUMBER | first name last name';


/* Email template */
$string['preview_email_greeting'] = 'Hello';
$string['send_email'] = 'Send Email';
$string['send_dialog_text'] = 'Are you sure you want to send the alert emails to the selected students?';
$string['cancel'] = 'Cancel';
$string['could_not_send_email'] = 'Sorry an error occured and we could not send the emails';

/*LDAP Setting*/
$string['pluginsettings'] = 'Plugin Settings';
$string['ldap_url'] = 'LDAP Url';
$string['ldap_user'] = 'LDAP User';
$string['ldap_password'] = 'LDAP User Password';
