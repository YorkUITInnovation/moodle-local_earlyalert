<?php

require_once($CFG->libdir . "/externallib.php");
require_once("$CFG->dirroot/config.php");

use local_earlyalert\email_report_log;
use local_earlyalert\base;

class local_earlyalert_course_overview_ws extends external_api
{
    /**
     * Returns description of method parameters
     * @return external_function_parameters
     */
    public static function get_course_overview_parameters()
    {
        return new external_function_parameters(
            array(
                'id' => new external_value(PARAM_INT, 'Course id', VALUE_REQUIRED),
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
    public static function get_course_overview($id)
    {
        global $CFG, $USER, $DB, $PAGE;

        //Parameter validation
        $params = self::validate_parameters(self::get_course_overview_parameters(), array(
                'id' => $id
            )
        );

        //Context validation
        //OPTIONAL but in most web service it should present
        $context = \context_system::instance();
        self::validate_context($context);

        // Get all logs
        $sql_unique_students = "SELECT DISTINCT target_user_id as userid FROM {local_earlyalert_report_log} WHERE course_id = $id";
        $unique_students = $DB->get_records_sql($sql_unique_students);
        $i = 0;
        $results = [];
        foreach ($unique_students as $us) {
            // get all logs for the student
            $sql_logs = "SELECT id FROM {local_earlyalert_report_log} WHERE course_id = $id AND target_user_id = " . $us->userid;
            $logs = $DB->get_records_sql($sql_logs);
            // Get the student record
            $student = $DB->get_record('user', ['id' => $us->userid], 'id,firstname, lastname, idnumber', MUST_EXIST);
            if (count($logs) > 0) {
                $student->has_logs = true;
            } else {
                $student->has_logs = false;
            }
            // Enter the student record into the results array
            $results[$i]= $student;
            $x = 0;
            foreach ($logs as $log) {
                // Get the log object
                $LOG = new email_report_log($log->id);
                // Get full student record
                $student = $LOG->get_student();
                // Get teacher record
                $teacher = $LOG->get_instructor();
                // Get unit record
                $unit = $LOG->get_unit_information();

                // Build data object
                $data = new \stdClass();
                $data->id = $log->id;
                $data->message_type = $LOG->get_message_type();
                $data->subject = $LOG->get_subject();
                $data->body = $LOG->get_body();
                $data->user_read = $LOG->get_user_read();
                $data->course_id = $LOG->get_course_id();
                $data->course_name = $LOG->get_course_name();
                $data->trigger_grade = $LOG->get_trigger_grade();
                $data->student_advised = $LOG->get_student_advised();
                $data->date_sent = $LOG->get_date_sent();
                $data->first_name = $student->firstname;
                $data->last_name = $student->lastname;
                $data->grade = $LOG->get_actual_grade();
                $data->idnumber = $student->idnumber;
                $data->campus = $unit->campus;
                $data->faculty = $unit->unit;
                $data->major = $student->major;
                $data->teacher_firstname = $teacher->firstname;
                $data->teacher_lastname = $teacher->lastname;
                $data->teacher_email = $teacher->email;
                // Add data to results
                $results[$i]->logs[$x] = $data;
                unset($LOG);
                unset($data);
                $x++;
            }

            $i++;
        }

        return ['students' => $results];
    }


    /** Returns users result value
     * @return external_description
     **/
    public static function get_course_overview_returns()
    {
        return new external_single_structure(
            array(
                'students' => new external_multiple_structure(
                    new external_single_structure(
                        array(
                            'id' => new external_value(PARAM_INT, 'Student ID'),
                            'firstname' => new external_value(PARAM_TEXT, 'First name'),
                            'lastname' => new external_value(PARAM_TEXT, 'Last name'),
                            'idnumber' => new external_value(PARAM_TEXT, 'ID Number'),
                            'has_logs' => new external_value(PARAM_BOOL, 'Student has logs'),
                            'logs' => new external_multiple_structure(
                                new external_single_structure(
                                    array(
                                        'id' => new external_value(PARAM_INT, 'Log ID'),
                                        'message_type' => new external_value(PARAM_TEXT, 'Message type'),
                                        'subject' => new external_value(PARAM_TEXT, 'Subject'),
                                        'body' => new external_value(PARAM_RAW, 'Body'),
                                        'user_read' => new external_value(PARAM_INT, 'User read status'),
                                        'course_id' => new external_value(PARAM_INT, 'Course ID'),
                                        'course_name' => new external_value(PARAM_TEXT, 'Course name'),
                                        'trigger_grade' => new external_value(PARAM_INT, 'Trigger grade'),
                                        'student_advised' => new external_value(PARAM_INT, 'Student advised status'),
                                        'date_sent' => new external_value(PARAM_TEXT, 'Date sent'),
                                        'first_name' => new external_value(PARAM_TEXT, 'Student first name'),
                                        'last_name' => new external_value(PARAM_TEXT, 'Student last name'),
                                        'grade' => new external_value(PARAM_INT, 'Grade'),
                                        'idnumber' => new external_value(PARAM_TEXT, 'Student ID number'),
                                        'campus' => new external_value(PARAM_TEXT, 'Campus'),
                                        'faculty' => new external_value(PARAM_TEXT, 'Faculty'),
                                        'major' => new external_value(PARAM_TEXT, 'Major'),
                                        'teacher_firstname' => new external_value(PARAM_TEXT, 'Teacher first name'),
                                        'teacher_lastname' => new external_value(PARAM_TEXT, 'Teacher last name'),
                                        'teacher_email' => new external_value(PARAM_TEXT, 'Teacher email')
                                    )
                                )
                            )
                        )
                    )
                )
            )
        );
    }
}