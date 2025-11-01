<?php

global $CFG, $OUTPUT, $PAGE, $DB, $USER;
require_once("../../config.php");


$logs = \local_earlyalert\logs::get_logs();

print_object($logs);