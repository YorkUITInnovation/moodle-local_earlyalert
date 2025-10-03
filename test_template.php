<?php
require_once('../../config.php');
require_admin();

global $DB;

use local_earlyalert\helper;

// Get parameters from URL
$campus = optional_param('campus', '', PARAM_TEXT);
$faculty = optional_param('faculty', '', PARAM_TEXT);
$department = strtoupper(optional_param('department', '', PARAM_TEXT));
$course_name = strtoupper(optional_param('course', '', PARAM_TEXT));
$course_number = strtoupper(optional_param('coursenumber', '', PARAM_TEXT));
$message_type = optional_param('message_type', 0, PARAM_INT);
$lang = strtolower(optional_param('lang', 'EN', PARAM_TEXT));
$grade_letter_id = optional_param('grade_letter_id', 0, PARAM_INT);

echo "<h1>Template Test Page</h1>";
echo "<h2>Input Parameters:</h2>";
echo "<ul>";
echo "<li>Campus: " . htmlspecialchars($campus) . "</li>";
echo "<li>Faculty: " . htmlspecialchars($faculty) . "</li>";
echo "<li>Department: " . htmlspecialchars($department) . "</li>";
echo "<li>Course: " . htmlspecialchars($course_name) . "</li>";
echo "<li>Course Number: " . htmlspecialchars($course_number) . "</li>";
echo "<li>Message Type: " . htmlspecialchars($message_type) . "</li>";
echo "<li>Lang: " . htmlspecialchars($lang) . "</li>";
echo "</ul>";

$template = helper::get_email_template($campus, $faculty, $department, $course_name, $course_number, $message_type, $lang);

echo "<h2>Selected Template:</h2>";

if ($template) {
    echo "<p><strong>Priority Selected:</strong> " . $template->priority . "</p>";
    echo "<pre>";
    print_r($template);
    echo "</pre>";
} else {
    echo "<p>No template found for the given parameters.</p>";
}

echo "<h2>All Grade Ranges:</h2>";
echo "<pre>";
$grade_ranges = helper::get_moodle_grade_percent_range($grade_letter_id);
print_r($grade_ranges);
echo "</pre>";
