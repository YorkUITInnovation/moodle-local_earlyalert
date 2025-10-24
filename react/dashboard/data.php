<?php

/**
 * This file is part of Cria.
 * Cria is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.
 * Cria is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 * You should have received a copy of the GNU General Public License along with Cria. If not, see <https://www.gnu.org/licenses/>.
 *
 * @package    local_cria
 * @author     Patrick Thibaudeau
 * @copyright  2024 onwards York University (https://yorku.ca)
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// Prevent any output before JSON
ob_start();

// Include Moodle config
require_once(__DIR__ . '../../../../../config.php');

// Require login
require_login();

global $DB;

// Clear any buffered output and set JSON headers
ob_end_clean();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

try {
    $date_range = optional_param('date_range', null, PARAM_TEXT);

    // Use the existing logs class to get data
    $logs = \local_earlyalert\logs::get_logs($date_range);

    // Transform the data to match the expected format for the React dashboard
    $formatted_logs = [];

    if ($logs && is_array($logs)) {
        foreach ($logs as $log) {
            $formatted_logs[] = [
                'id' => $log->id,
                'name' => $log->name,
                'subject' => $log->subject,
                'message' => $log->message,
                'context' => $log->context,
                'unit' => $log->unit,
                'active' => $log->active,
                'message_type' => $log->message_type,
                'campus' => $log->campus,
                'faculty' => $log->faculty,
                'course' => $log->course,
                'coursenumber' => $log->coursenumber,
                'hascustommessage' => $log->hascustommessage,
                'template_type' => $log->template_type,
                'instructor_idnumber' => $log->instructor_idnumber,
                'instructor_firstname' => $log->instructor_firstname,
                'instructor_lastname' => $log->instructor_lastname,
                'instructor_email' => $log->{'instructor_email;'} ?? $log->instructor_email ?? '',
                'course_fullname' => $log->course_fullname,
                'course_shortname' => $log->course_shortname,
                'course_idnumber' => $log->course_idnumber,
                'assignment_name' => $log->assignment_name,
                'trigger_grade' => $log->trigger_grade,
                'actual_grade' => $log->actual_grade,
                'student_advised_by_advisor' => $log->student_advised_by_advisor,
                'student_advised_by_instructor' => $log->student_advised_by_instructor,
                'custom_message' => $log->custom_message,
                'timecreated' => $log->timecreated,
                'date_message_sent' => $log->date_message_sent,
                'sisid' => $log->sisid,
                'firstname' => $log->firstname,
                'surname' => $log->surname,
                'academicyear' => $log->academicyear,
                'studysession' => $log->studysession,
                'sessionname' => $log->sessionname,
                'transcripttitle' => $log->transcripttitle,
                'progfaculty' => $log->progfaculty,
                'collegeaffiliation' => $log->collegeaffiliation,
                'college' => $log->college,
                'program' => $log->program,
                'acadqualification' => $log->acadqualification,
                'curriculumdetail' => $log->curriculumdetail,
                'subject1' => $log->subject1,
                'subject1faculty' => $log->subject1faculty,
                'subject1facultydesc' => $log->subject1facultydesc,
                'unit1' => $log->unit1,
                'title1' => $log->title1,
                'subject2' => $log->subject2,
                'subject2faculty' => $log->subject2faculty,
                'subject2facultydesc' => $log->subject2facultydesc,
                'unit2' => $log->unit2,
                'title2' => $log->title2,
                'basis' => $log->basis,
                'email' => $log->email,
                'studylevel' => $log->studylevel,
                'immigrationstatus' => $log->immigrationstatus,
                'visaflag' => $log->visaflag,
                'visaexpirydate' => $log->visaexpirydate,
                'languagecorrespondence' => $log->languagecorrespondence,
                'matureflag' => $log->matureflag,
                'osapflag' => $log->osapflag,
                'varsityflag' => $log->varsityflag,
                'eslflag' => $log->eslflag,
                'scholarshipflag' => $log->scholarshipflag,
                'ogpa' => $log->ogpa,
                'latestacademicdecision' => $log->latestacademicdecision,
                'academicdecisionterm' => $log->academicdecisionterm,
                'academicstatus' => $log->academicstatus,
                'registrationstatus' => $log->registrationstatus
            ];
        }
    }

    // Return JSON response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => $formatted_logs,
        'count' => count($formatted_logs),
        'date_range' => $date_range,
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (Exception $e) {
    // Return error response
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'data' => []
    ]);
}
