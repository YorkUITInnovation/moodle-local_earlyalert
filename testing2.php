<?php

global $CFG, $OUTPUT, $PAGE, $DB, $USER;
require_once("../../config.php");

$context = context_system::instance();

$PAGE->set_context($context);
$PAGE->set_url('/local/earlyalert/testing2.php');
$PAGE->set_pagelayout('standard');
$PAGE->set_title("Testing2");
$PAGE->set_heading("Testing2");

// Load ealry_alert_logs_2025-10-16.json file
$logfile = 'early_alert_logs_2025-10-16.json';
if (!file_exists($logfile)) {
    die("Log file not found: " . $logfile);
}


$jsonString = file_get_contents($logfile);
$dataArray = json_decode($jsonString, true);

//print_object($dataArray);
echo $OUTPUT->header();

$profileData = [];
foreach ($dataArray as $record) {
    $user = $DB->get_record('user', array('id' => $record['target_user_id']));
    if ($user) {
        $profile = $record;
        // Unset the last 19 keys from $profiles
        $keys = array_keys($profile);
        $toRemove = array_slice($keys, -19);
        foreach ($toRemove as $key) {
            unset($profile[$key]);
        }
        $student_profile = json_encode($profile);
        $log = $record;
        // Unset the first 41 keys from $log
        $keys = array_keys($log);
        $toRemove = array_slice($keys, 0, 41);
        foreach ($toRemove as $key) {
            unset($log[$key]);
        }
        unset($log['recordid']);
        $log['student_profile'] = $student_profile;
        $log['date_message_sent'] = strtotime($record['date_message_sent']);
        if ($id = $DB->insert_record('local_earlyalert_report_log', $log)) {
            echo "Inserted log record ID: " . $id . " for user: " . $user->username . "<br>";
        } else {
            echo "Failed to insert log record for user: " . $user->username . "<br>";
        }
    }
}

echo $OUTPUT->footer();
