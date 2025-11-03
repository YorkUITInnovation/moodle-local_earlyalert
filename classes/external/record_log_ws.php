<?php

require_once($CFG->libdir . "/externallib.php");
require_once("$CFG->dirroot/config.php");

use local_earlyalert\email_report_log;
use local_earlyalert\base;
class local_earlyalert_record_log_ws extends external_api
{
    /**
     * Returns description of method parameters
     * @return external_function_parameters
     */
    public static function insert_email_log_parameters()
    {
        return new external_function_parameters(
            array(
                'template_data' => new external_value(PARAM_RAW, 'All selected student ids', VALUE_OPTIONAL , '')
            )
        );
    }

    /**
     * @param $id
     * @return true
     * @throws dml_exception
     * @throws invalid_parameter_exception
     * @throws restricted_context_exception
     */
    public static function insert_email_log($template_data)
    {
        global $CFG, $USER, $DB, $PAGE;

        //Parameter validation
        $params = self::validate_parameters(self::insert_email_log_parameters(), array(
                'template_data' => $template_data
            )
        );

        //Context validation
        //OPTIONAL but in most web service it should present
        $context = \context_system::instance();
        self::validate_context($context);
        // check student template object map
        $id=0;
        $ids=[];
        $students = json_decode($template_data, true);
        forEach($students as $student) {
            // Get idnumber from user student_id
            $user = $DB->get_record('user', array('id' => $student['student_id']), '*', MUST_EXIST);
            // Oracle SQL
            $sql = "SELECT * FROM V222.VIEW_MOODLE_EARLY_ALERTS WHERE SISID=:sisid";
            $params = [':sisid' => trim($user->idnumber)];
            $OCI = new \local_earlyalert\oracle_client();
            $OCI->connect();
            $stid = $OCI->execute_query($sql, $params);

            $student_profile = '';
            if (count($stid) > 0) {
                $student_profile = json_encode($stid[0]);
            }
            // add to data structure
            $data= new stdClass();
            $data->template_id = ($student['template_id'] ?? 0);
            $data->revision_id = ($student['revision_id'] ?? 0);
            $data->triggered_from_user_id = ($student['triggered_from_user_id'] ?? 0);
            $data->target_user_id = ($student['student_id'] ?? 0);
            //all logs default to unread
            $data->user_read = 0;
            $data->course_id = ($student['course_id'] ?? 0);
            $data->instructor_id = ($student['instructor_id'] ?? 0);
            $data->assignment_name = ($student['assignment_name'] ?? 0);
            $data->trigger_grade = ($student['trigger_grade'] ?? 0);
            $data->actual_grade = self::convertGradeToNumeric($student['actual_grade'] ?? '');
            $data->custom_message = ($student['custom_message'] ?? '');
            //all logs default to unadvised
            $data->student_advised_by_advisor = 0;
            $data->student_advised_by_instructor = 0;
            $data->student_profile = $student_profile;
            //all logs default to unsent
            $data->date_message_sent = 0;
            $data->timecreated = time();
            $data->timemodified = time();
            $EMAIL_LOG = new email_report_log();
            $id = $EMAIL_LOG->insert_record($data);
            $id > 0 ? array_push($ids, $id) : error_log('error saving message');
        }

        return sizeof($ids);
    }

    /**
     * Converts grade display text to numeric value for database storage
     * @param string $gradeText - The grade text from the badge
     * @return int - Numeric grade value, -1 for no grade
     */
    private static function convertGradeToNumeric($gradeText) {
        // Handle common "no grade" cases
        if (empty($gradeText) || $gradeText === 'No Grade' || trim($gradeText) === '') {
            return -1;
        }

        // Extract numeric value from percentage (e.g., "85%" -> 85)
        if (preg_match('/(\d+(?:\.\d+)?)%/', $gradeText, $matches)) {
            return (int)round(floatval($matches[1]));
        }

        // Try to parse as a direct number
        if (is_numeric($gradeText)) {
            return (int)round(floatval($gradeText));
        }

        // For letter grades or other text, return -1
        return -1;
    }

    /**
     * Returns description of method result value
     * @return external_description
     */
    public static function insert_email_log_returns()
    {
        return new external_value(PARAM_INT, 'Boolean');
    }
}
