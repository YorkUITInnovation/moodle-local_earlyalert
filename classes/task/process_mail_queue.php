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
 * Scheduled task for processing mail queue.
 *
 * @package     local_earlyalert
 * @category    task
 * @copyright   2024 York University <itinnovation@yorku.ca>
 * @license     https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_earlyalert\task;

defined('MOODLE_INTERNAL') || die();

global $CFG;

require_once($CFG->dirroot . '/message/lib.php');

use local_earlyalert\email_report_log;
use local_etemplate\email;
use local_etemplate\emails;

/**
 * The main scheduled task for processing the email queue.
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
        global $DB, $CFG;

    	//lets do some stuff here!
        $where = 'date_message_sent = ?';
        if ($emailstoprocess = $DB->get_records_select('local_earlyalert_report_log', $where, array('0'))){
            //great there's emails to process
            mtrace("Found alerts to process!");
            foreach ($emailstoprocess as $emailtoprocess){
                $email = new email_report_log($emailtoprocess->id);
                //get template info
                $template = new email($email->get_templateid());
                // Get Adivsors that should be notified for the email
                $advisors = $template->get_unit_advisors();
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
                    $email->get_custom_message(),
                );
                $subject = $prepare_template->subject;
                $body = $prepare_template->message;
                $course_id = $emailtoprocess->course_id;
                $resolvedat = time();
                $teacher = $DB->get_record('user', ['id' => $email->get_instructor_id()], 'firstname, lastname');
                $snapshotvalues = [
                    'coursename' => $email->get_course_name(),
                    'teacherfirstname' => $teacher->firstname ?? '',
                    'teacherlastname' => $teacher->lastname ?? '',
                    'facultyname' => null,
                    'contactunit' => null,
                    'firstname' => $student->firstname ?? '',
                    'assignmenttitle' => $email->get_assignment_name(),
                    'grade' => $email->get_trigger_grade_letter(),
                    'custommessage' => $email->get_custom_message(),
                ];
                $thresholdmode = $email->get_threshold_mode();
                $thresholdpercent = $email->get_threshold_percent();
                $threshold = [
                    'raw' => $email->get_trigger_grade(),
                    'display' => $email->get_trigger_grade_letter(),
                    'kind' => $this->resolve_threshold_kind($thresholdmode, $thresholdpercent),
                    'mode' => $thresholdmode,
                    'percent' => $thresholdpercent,
                ];
                $context = [
                    'logid' => (int)$email->get_id(),
                    'courseid' => (int)$email->getCourseId(),
                    'targetuserid' => (int)$email->getTargetUserId(),
                    'instructorid' => (int)$email->get_instructor_id(),
                    'assignmentname' => $email->get_assignment_name(),
                ];
                $emailtoprocess->subjectjson = $this->encode_message_snapshot($this->build_message_snapshot_payload(
                    $template->get_id(),
                    $template->get_subject(),
                    $subject,
                    $snapshotvalues,
                    $resolvedat,
                    $context,
                    $threshold
                ));
                $emailtoprocess->messagejson = $this->encode_message_snapshot($this->build_message_snapshot_payload(
                    $template->get_id(),
                    $template->get_message(),
                    $body,
                    $snapshotvalues,
                    $resolvedat,
                    $context,
                    $threshold
                ));
                $emailtoprocess->timemodified = $resolvedat;
                try {
                    $DB->update_record('local_earlyalert_report_log', $emailtoprocess);
                } catch (\Exception $e) {
                    mtrace("Error saving message snapshot: " . $e->getMessage());
                }
                mtrace("attempting to send mail with this info:");
                mtrace("student = " . print_r($student, TRUE));
                mtrace("instructor id = " . print_r($email->get_instructor_id(), TRUE));
                mtrace("subject = " . print_r($subject, TRUE));
                mtrace("body = " . print_r($body, TRUE));
                try {
                    if (!$this->send_moodle_notification($email->get_instructor_id(), $email->getTargetUserId(), $subject, $body, $course_id)) {
                        throw new \Exception('Failed to send email');
                    }
                    mtrace("Alert sent to " . $email->getTargetUserId());
                    $emailtoprocess->date_message_sent = time();
                    $emailtoprocess->timemodified = $emailtoprocess->date_message_sent;
                    try {
                        if ($DB->update_record('local_earlyalert_report_log', $emailtoprocess)) {
                            mtrace("Alert flagged as sent");
                            //$this->send_moodle_notification($email->get_instructor_id(), $email->getTargetUserId(), $subject, $body, $course_id);
                            // Now send to advisors
                            if ($CFG->earlyalert_sendemailtoadvisors == true) {
                                foreach ($advisors as $key => $advisor) {
                                    $body = get_string('message_to_advisors', 'local_earlyalert') . $body;
                                    $this->send_moodle_notification($email->get_instructor_id(), $advisor, $subject, $body, $course_id);
                                }
                            }
                        }
                    } catch (\Exception $e) {
                        mtrace("Error updating report log table: " . $e->getMessage());
                    }
                } catch (\Exception $e) {
                    // Log or handle the exception in some way
                    mtrace('Error sending email: ' . $e->getMessage());
                }
            }
        } else {
            mtrace("No emails need to be processed");
        }
    }

    public function send_moodle_notification($userfrom, $userto, $subject, $body, $course_id){

        mtrace("sending moodle notification to user: " . $userto . " from " . $userfrom);
        // Create a new message object.
        try {
            $message = new \core\message\message();
            $message->component = 'local_earlyalert';
            $message->name = 'earlyalert_notification';
            $message->userfrom = $userfrom; // The user sending the message.
            $message->userto = $userto; // The user receiving the message.
            $message->subject = $subject;
            $message->fullmessage = $body;
            $message->fullmessageformat = FORMAT_HTML;
            $message->fullmessagehtml = $body;
            $message->smallmessage = 'An email alert with '. $subject . ' has been sent to you';
            $message->notification = 1; // This is a system generated notification.
            $message->courseid = $course_id;
            $messageid = message_send($message);
            mtrace("message id: " . $messageid);
            if ($messageid) {
                mtrace("Message sent to user: " . $userto . ' with message id: ' . $messageid);
                return true;
            }
        } catch (\Exception $e) {
            mtrace("Error creating message object: " . $e->getMessage());
            return false;
        }

        return false;
    }

    /**
     * Build a JSON-serialisable snapshot payload for the resolved message content.
     *
     * @param int $templateid
     * @param string $raw
     * @param string $rendered
     * @param array $values
     * @param int $resolvedat
     * @param array $context
     * @param array $threshold
     * @return array
     */
    private function build_message_snapshot_payload(
        int $templateid,
        string $raw,
        string $rendered,
        array $values,
        int $resolvedat,
        array $context,
        array $threshold
    ): array {
        return [
            'templateid' => $templateid,
            'raw' => $raw,
            'values' => $values,
            'rendered' => $rendered,
            'context' => $context,
            'threshold' => $threshold,
            'resolvedat' => $resolvedat,
        ];
    }

    /**
     * Resolve threshold kind for snapshot metadata.
     *
     * @param string $mode
     * @param float|null $percent
     * @return string
     */
    private function resolve_threshold_kind(string $mode, ?float $percent): string {
        if ($mode === 'percent' && $percent !== null) {
            return 'percentage';
        }

        if ($mode === 'letter') {
            return 'letter';
        }

        return 'unknown';
    }

    /**
     * Encode a snapshot payload for storage.
     *
     * @param array $payload
     * @return string
     */
    private function encode_message_snapshot(array $payload): string {
        $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        return $json === false ? '' : $json;
    }

}
