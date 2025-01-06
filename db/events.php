<?php
$observers  = array(

    array(
        'eventname'   => '\local_earlyalert\event\earlyalert_viewed',
        'callback'    => '\local_earlyalert\observer::earlyalert_viewed_event',
        'priority'    => 200,
        'internal'    => 0,
    ),

);