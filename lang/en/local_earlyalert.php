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
$string['alerts_raised'] = 'Alerts raised';
$string['assignment_instructions'] = '<ul>
<li>These messages inform students of a missed assignment that threatens their success in the course 
</li> 
<li>To ensure they know which assignment you are referring to, please enter the assignment title below.
<ul><li>Note that this title will appear in the email.</li></ul>
</li>
</ul>';
$string['assignment_title'] = 'Assignment Title';
$string['assignment_title_required'] = 'Please add an assignment title before previewing or sending';
$string['available_alert_types'] = 'Available alert types';
$string['course_list'] = 'Course List';
$string['course_overview'] = 'Course Overview';
$string['course_overview_instructions'] = '<ul>
<li>View all alerts raised for a particular course</li>
<li>Indicate that you have advised a student that has followed-up</li>
</ul>';
$string['course_overview_render_instructions'] = '<ul>
<li>This shows the list of students in this course on whom you have raised alerts.</li>
  <li>Click on the student’s name to see the alert type(s) and details.</li>
  <li>To indicate that a student has followed up with you, check off the appropriate box under “advising status”.</li>
</ul>';
$string['early_alert'] = 'Early Alert';
$string['earlyalert_viewed'] = 'Early Alert Viewed';
$string['exam_instructions'] = '<ul>
<li>These messages inform students of a missed exam that threatens their success in the course  
</li>
</ul>';
$string['idashboard'] = 'Instructor Dashboard';
$string['impersonate_user'] = 'Send on behalf of';
$string['impersonating_user'] = 'Impersonating User';
$string['generate_reports'] = 'Generate Reports';
$string['grade'] = 'Grade';
$string['grade_instructions'] = '<ul>
<li>Grades messages inform students they are averaging below a certain letter grade.
    <ul><li>The default has been set to a D+.</li></ul>
</li> 
<li>Should you wish to adjust this for your course, please use the selector below.
<ul><li>Note that this is the letter grade that will appear in the email. </li></ul>
</li>
</ul>';
$string['lookup_student'] = 'Lookup Student';
$string['low_grade'] = 'Low grade';
$string['manage_roles'] = 'Manage Roles';
$string['manage_templates'] = 'Manage Templates';
$string['markham_streams'] = 'Markham Streams';
$string['message_to_advisors'] = 'You are receiving this email because you are the advisor for the following student(s) who has/have been identified as at risk in one or more of their courses. Please follow up with the student(s) as soon as possible.' . "\n\n";
$string['missed_assignment'] = 'Missed Assignment';
$string['missed_exam'] = 'Missed Exam';
$string['my_courses'] = 'My Courses';
$string['my_list_of_students'] = 'My List of Students';
$string['my_tools'] = 'My Tools';
$string['name'] = 'Name';
$string['select_grade'] = 'Default Grade';
$string['select_students'] ='Select the students to whom you would like a {$a} alert to be sent by using the checkbox(es) below.<br><br>
You can preview the message by clicking on the “preview” button prior to sending.';
$string['send_email_to_advisors'] = 'Send email to advisors?';
$string['showgrades'] = 'Show Grades';
$string['student_lookup'] = 'Student Lookup';
$string['student_lookup_help'] = '<ul><li>You can search for a student using their student number (SISID) or Name</li>
<li>You can wildcard (*) the name if required, and then select the correct student from the list </li>
</ul>';
$string['student_lookup_instructions'] = '<ul>
<li>Please find the student’s course enrolments below. If a course <span class="text-danger">appears in red</span>, an alert has been raised.</li>
    <li>Click on the course name to view the type of alert and additional details </li>
    <li>To indicate that you have spoken to the student about a specific course, check off the appropriate box under “advising status”</li>
    </ul>';
$string['preview_email'] = 'Preview';
$string['process_mail_queue'] = 'Process Early Alert queue';
$string['raise_an_alert'] = 'Raise an Alert';
$string['send'] = 'Send';
$string['preview'] = 'Preview';
$string['selected_alert_based_on'] = 'You are selecting an alert based on a';
$string['send_alert_based_on'] = 'Send an alert based on';
$string['student_list'] = 'LIST OF STUDENTS:  IDNUMBER | first name last name';
$string['view_message'] = 'View Message Details';
$string['update_campus'] = 'Update Campus profile field';


/* Email template */
$string['preview_email_greeting'] = 'Hello';
$string['send_email'] = 'Send Email';
$string['send_dialog_text'] = 'Are you sure you want to send the alert emails to the selected students?';
$string['sent_dialog_text'] = 'Thank you. This message has been scheduled to be sent to {$a} students.';
$string['cancel'] = 'Cancel';
$string['could_not_send_email'] = 'Sorry an error occured and we could not send the emails';

/* Toast messages */
$string['advised_success_toast'] = 'Advised option updated successfully';
$string['advised_failed_toast'] = 'Advised option not saved, conatact your administrator';

/*LDAP Setting*/
$string['pluginsettings'] = 'Plugin Settings';
$string['ldap_url'] = 'LDAP Url';
$string['ldap_user'] = 'LDAP User';
$string['ldap_password'] = 'LDAP User Password';

// Capabilities
$string['earlyalert:access_early_alert'] = 'Access Early Alert (Should be for teachers)';
$string['earlyalert:impersonate'] = 'Impersonate users';
$string['earlyalert:student_lookup'] = 'Student Lookup';
$string['earlyalert:view_reports'] = 'View Reports';

// Message provider
$string['messageprovider:earlyalert_notification'] = 'Early Alert Notification';