<?php

/**
 * A scheduled task for early alerts
 *
 * @package    local_earlyalert
 */
namespace local_earlyalert\task;

use local_earlyalert\email_report_log;
use local_etemplate\email;
use local_etemplate\emails;

defined('MOODLE_INTERNAL') || die();

/**
 * The main scheduled task for the Early Alerts plugin
 *
 * @package    local_earlyalert
 */
class process_mail_queue extends \core\task\scheduled_task {

    /**
     * Get a descriptive name for this task (shown to admins).
     *
     * @return string
     */
    public function get_name() {
        return get_string('process_mail_queue', 'local_earlyalert');
    }

    /**
     * Execute the scheduled task.
     */
    public function execute() {
        global $DB;

    	//lets do some stuff here!
        $where = 'date_message_sent = ?';
        if ($emailstoprocess = $DB->get_records_select('local_earlyalert_report_log', $where, array('0'))){
            //great there's emails to process
            mtrace("Found alerts to process!");
            foreach ($emailstoprocess as $emailtoprocess){
                $email = new email_report_log($emailtoprocess->id);
                //get template info
                $template = new email($email->get_templateid());
                // Build info to send email
                $student = $email->get_student();
                $prepare_template = email::replace_message_placeholders(
                    $template->get_message(),
                    $template->get_subject(),
                    $email->getCourseId(),
                    $student,
                    $email->get_instructor_id(),
                    $email->get_trigger_grade_letter(),
                    $email->get_assignment_name(),
                );
                $subject = $prepare_template->subject;
                $body = $prepare_template->message;
                mtrace("attempting to send mail with this info:");
                mtrace("student = " . print_r($student, TRUE));
                mtrace("instructor id = " . print_r($email->get_instructor_id(), TRUE));
                mtrace("subject = " . print_r($subject, TRUE));
                mtrace("body = " . print_r($body, TRUE));
                try {
                    if (!email_to_user($student, $email->get_instructor_id(), $subject, $body, $body)) {
                        throw new Exception('Failed to send email');
                    }
                    mtrace("Alert sent to " . $email->getTargetUserId());
                    $emailtoprocess->date_message_sent = time();
                    try {
                        if ($DB->update_record('local_earlyalert_report_log', $emailtoprocess)) {
                            mtrace("Alert flagged as sent");
                        }
                    } catch (Exception $e) {
                        mtrace("Error updating report log table: " . $e->getMessage());
                    }
                } catch (Exception $e) {
                    // Log or handle the exception in some way
                    mtrace('Error sending email: ' . $e->getMessage());
                }
            }
        } else {
            mtrace("No emails need to be processed");
        }
    }

}
