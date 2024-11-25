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
                'template_data' => new external_value(PARAM_RAW, 'data for student templates', false, 0),
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
                'template_data'	=>	$template_data,
            )
        );

        //Context validation
        //OPTIONAL but in most web service it should present
        $context = \context_system::instance();
        self::validate_context($context);
        // check student template object map
        $template_array = json_decode($params['template_data'], true);
        $count = 0;
        forEach($template_array as $template) {
            $data = new stdClass();

            $data->template_id = ($template['revision_id'] !== null) ? $template['template_id'] : 0;
            $data->revision_id = ($template['revision_id'] !== null) ? $template['revision_id'] : 0;
            $data->triggered_from_user_id = ($template['instructor_id'] !== null) ? $template['instructor_id'] : 0;
            $data->target_user_id = $template['student_id'];
            $data->subject = $template['templateEmailSubject'];
            //$data->body = $template['templateEmailContent'];
            $data->body = 'email retrieved using template_id, revision_id, target_user_id, course_id etc';
            $data->user_read = ($template['user_read'] !== null) ? $template['user_read'] : 0;
            $data->unit_id = ($template['unit_id'] !== null) ? $template['unit_id'] : 0;
            $data->department_id = ($template['department_id'] !== null) ? $template['department_id'] : 0;
            $data->facultyspecific_text_id = ($template['facultyspecific_text_id'] !== null) ? $template['facultyspecific_text_id'] : 0;
            $data->instructor_id = ($template['instructor_id'] !== null) ? $template['instructor_id'] : 0;
            $data->course_id = ($template['course_id'] !== null) ? $template['course_id'] : 0;
            $data->assignment_id = ($template['assignment_id'] !== null) ? $template['assignment_id'] : 0;
            $data->trigger_grade = ($template['trigger_grade'] !== null) ? $template['trigger_grade'] : 0;
            $data->trigger_grade_letter = ($template['trigger_grade_letter'] !== null) ? $template['trigger_grade_letter'] : '';
            $data->actual_grade = ($template['actual_grade'] !== null) ? $template['actual_grade'] : 0;
            $data->actual_grade_letter = ($template['actual_grade_letter'] !== null) ? $template['actual_grade_letter'] : 0;
            $data->student_advised = ($template['student_advised'] !== null) ? $template['student_advised'] : 0;
            $data->date_message_sent = ($template['date_message_sent'] !== null) ? $template['date_message_sent'] : 0;

            $EMAIL_LOG = new email_report_log();
            $EMAIL_LOG->insert_record($data);
            $count++;
        }
        return $count;
    }

    /**
     * Returns description of method result value
     * @return external_description
     */
    public static function insert_email_log_returns()
    {
        return new external_value(PARAM_INT, 'Integer');
    }
}
