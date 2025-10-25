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
$string['available_alert_types'] = 'My available alerts';
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
<li>These messages inform students of a missed test/quiz that threatens their success in the course  
</li>
</ul>';
$string['idashboard'] = 'Instructor Dashboard';
$string['impersonate_user'] = 'Send on behalf of: {$a}';
$string['impersonating_user'] = 'Impersonating User';
$string['generate_reports'] = 'Generate Reports';
//$string['grade'] = 'Course Total';
$string['grade'] = 'Gradebook Course Total (if applicable)';
$string['grade_instructions'] = '
<ul>
    <li>Grades messages inform students they are averaging below a certain letter grade.
        <ul><li>The default has been set to a D+.</li></ul>
    </li> 
    <li>Should you wish to adjust this for your course, please use the selector below.
        <ul>
            <li>Note that this is the letter grade that will appear in the email (e.g. you are averaging a D+ or less)</li>
            <li>If you are using the gradebook, this is also how you sort your students to show only those averaging a specific grade or less (based on the gradebook course total). If you set the box to D+, for example, you will only see a list of students who are averaging a D+ or less in your list. In order for this feature to work properly, you must have “exclude empty grades” checked under “Grade category” in your eClass settings.</li>
        </ul>
    </li>    
</ul>';
$string['no_gradebook_instructions']  = 'If you are using the gradebook but the calculation is not functioning as intended and/or you would like to select students manually, check the box below';
$string['lookup_student'] = 'Lookup Student';
$string['low_grade'] = 'Low grade';
$string['manage_roles'] = 'Manage Roles';
$string['manage_templates'] = 'Manage Templates';
$string['markham_streams'] = 'Markham Streams';
$string['message_to_advisors'] = 'You are receiving this email because you are the advisor for the following student(s) who has/have been identified as at risk in one or more of their courses. Please follow up with the student(s) as soon as possible.' . "\n\n";
$string['missed_assignment'] = 'Missed Assignment';
$string['missed_exam'] = 'Missed Test/Quiz';
$string['my_courses'] = 'My Courses';
$string['my_list_of_students'] = 'My List of Students';
$string['my_tools'] = 'My Tools';
$string['name'] = 'Name';
$string['select_grade'] = 'Default Grade';
$string['select_students'] ='Select the students to whom you would like a {$a} alert to be sent by using the checkbox(es) below.<br><br>
You can preview the message by clicking on the “preview” button prior to sending.<br><em>N.B. Graduate Students and Teaching Assistants may appear here – please disregard them.</em>';
$string['send_email_to_advisors'] = 'Send email to advisors?';
$string['showgrades'] = 'Show Grades';
$string['student_lookup'] = 'Student Lookup';
$string['student_lookup_help'] = '<ul><li>You can search for a student using their student number (SISID) or Name</li>
<li>You can wildcard (*) the name if required, and then select the correct student from the list </li>
</ul>';
$string['student_lookup_instructions'] = '<ul>
<li>Please find the student’s course enrolments below. If a course <span class="text-danger">appears in red</span>, an alert has been raised. <strong> N.B. You may see discrepancies between this list and what is in PES, as these courses must also be active in eClass to show here.</strong> If a student drops the course after receiving an alert, it will not appear here. These students will be captured via our reports.</li>
<li>Click on the course name to view the type of alert and additional details</li>
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
$string['no_courses'] = 'No Courses found';
$string['custom_message_button_label'] = 'Show Custom Message';
$string['not_using_gradebook'] = 'View all my students, irrespective of grade';

/* Email template */
$string['preview_email_greeting'] = 'Hello';
$string['send_email'] = 'Send Email';
$string['send_dialog_text'] = 'Are you sure you want to send the alert emails to the selected students?';
$string['sent_dialog_text'] = 'Thank you. This message has been scheduled to be sent to {$a} students.';
$string['cancel'] = 'Cancel';
$string['could_not_send_email'] = 'Sorry an error occured and we could not send the emails';
$string['showactivecourses_desc']= 'Shulich courses are always hidden so this option would help';
$string['showactivecourses'] = 'Only active courses for Instructors';
$string['savessuccess'] = 'Template saved successfully';

/* Toast messages */
$string['advised_success_toast'] = 'Advised option updated successfully';
$string['advised_failed_toast'] = 'Advised option not saved, conatact your administrator';

/*LDAP Setting*/
$string['pluginsettings'] = 'Plugin Settings';
$string['ldap_url'] = 'LDAP Url';
$string['ldap_user'] = 'LDAP User';
$string['ldap_password'] = 'LDAP User Password';

// Capabilities
$string['earlyalert:access_early_alert'] = 'Access Early Alert';
$string['earlyalert:impersonate'] = 'Impersonate users';
$string['earlyalert:student_lookup'] = 'Student Lookup';
$string['earlyalert:view_reports'] = 'View Reports';

// Message provider
$string['messageprovider:earlyalert_notification'] = 'Early Alert Notification';

// Azure OpenAI Settings
$string['azureopenai_settings'] = 'Azure OpenAI Settings';
$string['azureopenai_settings_desc'] = 'Configure Azure OpenAI integration for the AI Analytics Assistant feature in the React dashboard. This enables conversational analytics and data insights.';
$string['azureopenai_apikey'] = 'Azure OpenAI API Key';
$string['azureopenai_apikey_desc'] = 'Enter your Azure OpenAI API key. You can find this in the Azure Portal under your OpenAI resource > Keys and Endpoint.';
$string['azureopenai_endpoint'] = 'Azure OpenAI Endpoint';
$string['azureopenai_endpoint_desc'] = 'Enter your Azure OpenAI endpoint URL (e.g., https://your-resource-name.openai.azure.com/). Find this in the Azure Portal under your OpenAI resource > Keys and Endpoint.';
$string['azureopenai_deployment'] = 'Azure OpenAI Deployment Name';
$string['azureopenai_deployment_desc'] = 'Enter the deployment name for your GPT model (e.g., gpt-4, gpt-35-turbo). This is the name you assigned when deploying the model in Azure OpenAI Studio.';
$string['azureopenai_version'] = 'Azure OpenAI API Version';
$string['azureopenai_version_desc'] = 'The Azure OpenAI API version to use. Default is 2024-08-01-preview. Only change if you need a specific API version.';

// React dashboards
$string['administrative_reports'] = 'Administrative Reports';
$string['advisor_reports'] = 'Advisor Reports';

// React dashboard UI strings
$string['refresh_data'] = 'Refresh Data';
$string['ask_ai'] = 'Ask AI';
$string['hide_ai'] = 'Hide AI';
$string['generate_charts'] = 'Generate Charts';
$string['hide_charts'] = 'Hide Charts';
$string['ai_analytics_assistant'] = 'AI Analytics Assistant';
$string['ask_questions_about_data'] = 'Ask questions about your dashboard data';
$string['ai_assistant'] = 'AI Assistant';
$string['analyzing_data'] = 'Analyzing your data...';
$string['suggested_questions'] = 'Suggested questions:';
$string['type_message'] = 'Ask me anything about your dashboard data...';
$string['total_students'] = 'Total Students';
$string['unique_students'] = 'Unique Students';
$string['active_alerts'] = 'Active Alerts';
$string['faculties_engaged'] = 'Faculties Engaged';
$string['resolution_rate'] = 'Resolution Rate';
$string['high_priority'] = 'High Priority';
$string['students_at_risk'] = 'Students at Risk';
$string['alert_distribution'] = 'Alert Distribution';
$string['faculty_distribution'] = 'Faculty Distribution';
$string['timeline_trends'] = 'Timeline Trends';
$string['intervention_effectiveness'] = 'Intervention Effectiveness';
$string['campus_analysis'] = 'Campus Analysis';
$string['alerts_by_type'] = 'Alerts by Type';
$string['alerts_by_faculty'] = 'Alerts by Faculty';
$string['alert_timeline'] = 'Alert Timeline';
$string['students_by_status'] = 'Students by Status';
$string['loading'] = 'Loading...';
$string['error_loading'] = 'Error loading';
$string['no_data_available'] = 'No data available';
$string['student_alerts'] = 'Student Alerts';
$string['search_students'] = 'Search students...';
$string['filter_by'] = 'Filter by';
$string['all'] = 'All';
$string['status'] = 'Status';
$string['priority'] = 'Priority';
$string['alert_type'] = 'Alert Type';
$string['date_raised'] = 'Date Raised';
$string['last_updated'] = 'Last Updated';
$string['actions'] = 'Actions';
$string['view_details'] = 'View Details';
$string['contact_student'] = 'Contact Student';
$string['export_data'] = 'Export Data';
$string['showing_results'] = 'Showing {$a} results';
$string['administrator'] = 'Administrator';
$string['advisor'] = 'Advisor';
$string['staff'] = 'Staff';
$string['requiring_attention'] = 'Requiring attention';
$string['active_monitoring'] = 'Active monitoring';
$string['students_contacted'] = 'Students contacted';
$string['currently_tracked'] = 'Currently tracked';
$string['alert_trends_3months'] = 'Alert Trends (Last 3 Months)';
$string['monthly_alert_activity'] = 'Monthly alert activity';
$string['alert_distribution_by_student_home_faculty'] = 'Alert Distribution by Student Home Faculty';
$string['alert_distribution_by_faculty'] = 'Alert Distribution by Student Home Faculty';
$string['top'] = 'Top';
$string['top_faculties'] = 'Top {$a} faculties';
$string['alert_distribution_by_course_faculty'] = 'Alert Distribution by Course Faculty';
$string['faculty_performance_analysis'] = 'Faculty Performance Analysis';
$string['comprehensive_faculty_metrics'] = 'Comprehensive faculty-level metrics and outcomes';
$string['faculties_monitored'] = 'faculties monitored';
$string['faculty'] = 'Faculty';
$string['total_alerts'] = 'Total Alerts';
$string['total_alerts_for'] = 'Total Alerts for';
$string['students'] = 'Students';
$string['contacted'] = 'Contacted';
$string['missed_test_quiz'] = 'Missed Test/Quiz';
$string['strategic_insights_recommendations'] = 'Strategic Insights & Recommendations';
$string['intervention_efficiency'] = 'Intervention Efficiency';
$string['resource_allocation'] = 'Resource Allocation';
$string['system_coverage'] = 'System Coverage';
$string['resolved'] = 'Resolved';
$string['alerts'] = 'alerts';
$string['first_half_alerts'] = '1st-15th';
$string['second_half_alerts'] = '16th-End';
$string['intervention_efficiency_text'] = '{$a}% of alerts are being successfully addressed. Consider expanding successful intervention strategies to underperforming areas.';
$string['resource_allocation_text'] = '{$a}% of alerts are high priority. Review resource distribution to ensure adequate support for critical cases.';
$string['system_coverage_text'] = 'Monitoring {$a}% of student population. Strong coverage indicates effective early warning system implementation.';
