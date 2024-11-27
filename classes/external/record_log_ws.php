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
            $data->actual_grade = ($student['actual_grade'] ?? 0);
            //all logs default to unadvised
            $data->student_advised_by_advisor = 0;
            $data->student_advised_by_instructor = 0;
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
     * Returns description of method result value
     * @return external_description
     */
    public static function insert_email_log_returns()
    {
        return new external_value(PARAM_INT, 'Boolean');
    }
}