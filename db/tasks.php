<?php

/**
 *
 * @package   local_earlyalert
 * @category  task
 */

defined('MOODLE_INTERNAL') || die();

$tasks = array(
    array(
        'classname' => 'local_earlyalert\task\process_mail_queue',
        'blocking' => 0,
        'minute' => '0,10,20,30,40,50',
        'hour' => '*',
        'day' => '*',
        'month' => '*',
        'dayofweek' => '*'
    ),
    array(
        'classname' => 'local_earlyalert\task\update_campus',
        'blocking' => 0,
        'minute' => '*',
        'hour' => '5',
        'day' => '*',
        'month' => '*',
        'dayofweek' => '*'
    )
);
