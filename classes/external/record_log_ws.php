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
                'ids' => new external_value(PARAM_RAW, 'All selected student ids', VALUE_OPTIONAL , ''),
                'course_id' => new external_value(PARAM_INT, 'The course id', VALUE_OPTIONAL, 0),
                'alert_type' => new external_value(PARAM_TEXT, 'The alert type: grade, assign, exam', VALUE_OPTIONAL, 0),
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
    public static function insert_email_log($ids, $course_id, $alert_type)
    {
        global $CFG, $USER, $DB, $PAGE;

        //Parameter validation
        $params = self::validate_parameters(self::insert_email_log_parameters(), array(
                'ids' => $ids,
                'course_id'	=> $course_id,
                'alert_type' =>	$alert_type
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
            $data->template_id = $template->template_id;
            $data->revision_id = $template->revision_id;
            $data->triggered_from_user_id = $template->triggered_from_user_id;
            $data->target_user_id = $template->student_id;
            $data->subject = $template->templateEmailSubject;
            $data->body = $template->templateEmailContent;
            $data->user_read = $template->user_read;
            $data->unit_id = $template->unit_id;
            $data->department_id = $template->department_id;
            $data->facultyspecific_text_id = $template->facultyspecific_text_id;
            $data->course_id = $template->course_id;
            $data->instructor_id = $template->instructor_id;
            $data->assignment_id = $template->assignment_id;
            $data->trigger_grade = $template->trigger_grade;
            $data->trigger_grade_letter = $template->trigger_grade_letter;
            $data->actual_grade = $template->actual_grade;
            $data->actual_grade_letter = $template->actual_grade_letter;
            $data->student_advised = $template->student_advised;
            $data->date_message_sent = $template->date_message_sent;
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