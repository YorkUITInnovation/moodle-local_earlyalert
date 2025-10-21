<?php

//global $CFG, $OUTPUT, $PAGE, $DB, $USER;
//require_once("../../config.php");
include_once('classes/oracle_client.php');

//use local_earlyalert\oracle_client;
//use local_earlyalert\helper;
//use local_earlyalert\email_report_log;

// Check if user has access to early alert
//$context = context_system::instance();





// Read the JSON file
$jsonString = file_get_contents('Logs.json');

// Decode JSON to associative array
$dataArray = json_decode($jsonString, true);

$OCI = new \local_earlyalert\oracle_client('moodle_reader', 'R3ad4M00der', '(DESCRIPTION = (ADDRESS = (PROTOCOL = TCP)(HOST = exacc-npe3.uit.yorku.ca)(PORT = 1521)) (CONNECT_DATA = (SERVER = DEDICATED) (SERVICE_NAME = sisqa.uit.yorku.ca) (FAILOVER_MODE = (TYPE = select) (METHOD = basic))))');
$OCI->connect();

$records = [];

foreach ($dataArray as $row) {
    $sql = "SELECT * FROM V222.VIEW_MOODLE_EARLY_ALERTS WHERE SISID=" . $row['sisid'];
    $stid = $OCI->execute_query($sql);
    if (isset($stid[0])) {
    unset($row['sisid']);
    $profile = array_merge($stid[0], $row);
    $profile['recordid'] = $row['id'];
    echo "<pre>";
    print_r($profile);
    echo "</pre>";
    $records[] = $profile;
    } else {
        echo "No data found for SISID: " . $row['sisid'] . "Record ID: " . $row['id'] .  "<br>";
    }
}

file_put_contents('early_alert_logs_' . date('Y-m-d') . '.json', json_encode($records));



//$rows = array();
//while (($row = oci_fetch_array($stid, OCI_ASSOC + OCI_RETURN_NULLS))) {
//    $rows[] = $row;
//}







