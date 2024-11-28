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
    'earlyalert_course_overview' => array(
        'classname' => 'local_earlyalert_course_overview_ws',
        'methodname' => 'get_course_overview',
        'classpath' => 'local/earlyalert/classes/external/course_overview_ws.php',
        'description' => 'Returns all students ith alerts for a course',
        'type' => 'write',
        'capabilities' => '',
        'ajax' => true
    ),
    'earlyalert_update_student_status_instructor' => array(
        'classname' => 'local_earlyalert_course_overview_ws',
        'methodname' => 'update_student_status_instructor',
        'classpath' => 'local/earlyalert/classes/external/course_overview_ws.php',
        'description' => 'Updates status for field student_advised_by_instructor',
        'type' => 'write',
        'capabilities' => '',
        'ajax' => true
    ),
    'earlyalert_update_student_status_advisor' => array(
        'classname' => 'local_earlyalert_course_overview_ws',
        'methodname' => 'update_student_status_advisor',
        'classpath' => 'local/earlyalert/classes/external/course_overview_ws.php',
        'description' => 'Updates status for field student_advised_by_advisor',
        'type' => 'write',
        'capabilities' => '',
        'ajax' => true
    ),
    'earlyalert_get_users' => array(
        'classname' => 'local_earlyalert_users_ws',
        'methodname' => 'get_users',
        'classpath' => 'local/earlyalert/classes/external/users_ws.php',
        'description' => 'Search users for a select box',
        'type' => 'read',
        'capabilities' => '',
        'ajax' => true
    ),
    'earlyalert_get_message' => array(
        'classname' => 'local_earlyalert_course_overview_ws',
        'methodname' => 'get_message',
        'classpath' => 'local/earlyalert/classes/external/course_overview_ws.php',
        'description' => 'Returns subject and body from email template',
        'type' => 'read',
        'capabilities' => '',
        'ajax' => true
    ),
);