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
    public static function insert_email_log($ids)
    {
        global $CFG, $USER, $DB, $PAGE;

        //Parameter validation
        $params = self::validate_parameters(self::insert_email_log_parameters(), array(
                'template_data' => $ids
            )
        );

        //Context validation
        //OPTIONAL but in most web service it should present
        $context = \context_system::instance();
        self::validate_context($context);
        // check student template object map
        $students = json_decode($ids, true);
        forEach($students as $student) {

            // add to data structure
            $data= new stdClass();
            $data->template_id = ($student['template_id'] ?? 0);
            $data->revision_id = ($student['revision_id'] ?? 0);
            $data->triggered_from_user_id = ($student['triggered_from_user_id'] ?? 0);
            $data->target_user_id = ($student['student_id'] ?? 0);
            $data->subject = ($student['templateEmailSubject'] ?? '');
            $data->body = ($student['templateEmailContent'] ?? '');
            $data->user_read = ($student['user_read'] ?? false);
            $data->unit_id = ($student['unit_id'] ?? 0);
            $data->department_id = ($student['department_id'] ?? 0);
            $data->facultyspecific_text_id = ($student['facultyspecific_text_id'] ?? 0);
            $data->course_id = ($student['course_id'] ?? 0);
            $data->instructor_id = ($student['instructor_id'] ?? 0);
            $data->assignment_id = ($student['assignment_id'] ?? 0);
            $data->trigger_grade = ($student['trigger_grade'] ?? 0);
//            $data->trigger_grade_letter = ($student['trigger_grade_letter'] ?? '');
            $data->actual_grade = ($student['actual_grade'] ?? 0);
//            $data->actual_grade_letter = ($student['actual_grade_letter'] ?? '');
            $data->student_advised = ($student['student_advised'] ?? false);
            $data->date_message_sent = ($student['date_message_sent'] ?? '');
            $EMAIL_LOG = new email_report_log();
            $EMAIL_LOG->insert_record($data);
        }

        return true;
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


//'revision_id' => new external_value(PARAM_INT, 'Revision ID', false, 0),
//                'triggered_from_user_id' => new external_value(PARAM_INT, 'Revision ID', false, 0),
//                'target_user_id' => new external_value(PARAM_INT, 'Revision ID', false, 0),
//                'subject' => new external_value(PARAM_TEXT, 'Revision ID', false, 0),
//                'body' => new external_value(PARAM_TEXT, 'Revision ID', false, 0),
//                'user_read' => new external_value(PARAM_INT, 'Revision ID', false, 0),
//                'unit_id' => new external_value(PARAM_INT, 'Revision ID', false, 0),
//                'department_id' => new external_value(PARAM_INT, 'Revision ID', false, 0),
//                'facultyspecific_text_id' => new external_value(PARAM_INT, 'Revision ID', false, 0),
//                'course_id' => new external_value(PARAM_INT, 'Revision ID', false, 0),
//                'instructor_id' => new external_value(PARAM_INT, 'Revision ID', false, 0),
//                'assignment_id' => new external_value(PARAM_INT, 'Revision ID', false, 0),
//                'trigger_grade' => new external_value(PARAM_INT, 'Revision ID', false, 0),
//                'trigger_grade_letter' => new external_value(PARAM_TEXT, 'Revision ID', false, 0),
//                'actual_grade' => new external_value(PARAM_INT, 'Revision ID', false, 0),
//                'actual_grade_letter' => new external_value(PARAM_INT, 'Revision ID', false, 0),
//                'student_advised' => new external_value(PARAM_INT, 'Revision ID', false, 0),
//                'date_message_sent' => new external_value(PARAM_INT, 'Revision ID', false, 0)

//template_id,$revision_id,$triggered_from_user_id,$target_user_id,$subject,$body,$user_read,$unit_id,$department_id,$facultyspecific_text_id,$course_id,$instructor_id,$assignment_id,$trigger_grade,$trigger_grade_letter,$actual_grade,$actual_grade_letter,$student_advised,$date_message_sent


//'template_id'	=>	$template_id,
//                'revision_id'	=>	$revision_id,
//                'triggered_from_user_id'	=>	$triggered_from_user_id,
//                'target_user_id'	=>	$target_user_id,
//                'subject'	=>	$subject,
//                'body'	=>	$body,
//                'user_read'	=>	$user_read,
//                'unit_id'	=>	$unit_id,
//                'department_id'	=>	$department_id,
//                'facultyspecific_text_id'	=>	$facultyspecific_text_id,
//                'course_id'	=>	$course_id,
//                'instructor_id'	=>	$instructor_id,
//                'assignment_id'	=>	$assignment_id,
//                'trigger_grade'	=>	$trigger_grade,
//                'trigger_grade_letter'	=>	$trigger_grade_letter,
//                'actual_grade'	=>	$actual_grade,
//                'actual_grade_letter'	=>	$actual_grade_letter,
//                'student_advised'	=>	$student_advised,
//                'date_message_sent'	=>	$date_message_sent