<?php

$functions = array(
    'earlyalert_course_grades_percent_get' => array(
        'classname' => 'local_earlyalert_course_grades_ws',
        'methodname' => 'get_course_grades_percent',
        'classpath' => 'local/earlyalert/classes/external/course_grades_ws.php',
        'description' => 'return course grades in percentages for a course',
        'type' => 'read',
        'capabilities' => '',
        'ajax' => true
    ),
    'earlyalert_course_student_templates' => array(
        'classname' => 'local_earlyalert_course_grades_ws',
        'methodname' => 'get_course_student_templates',
        'classpath' => 'local/earlyalert/classes/external/course_grades_ws.php',
        'description' => 'return list of email templates for this course',
        'type' => 'read',
        'capabilities' => '',
        'ajax' => true
    ),
    'earlyalert_report_log_insert' => array(
        'classname' => 'local_earlyalert_record_log_ws',
        'methodname' => 'insert_email_log',
        'classpath' => 'local/earlyalert/classes/external/record_log_ws.php',
        'description' => 'inserts reporting log of early alert email',
        'type' => 'write',
        'capabilities' => '',
        'ajax' => true
    ),
);