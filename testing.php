<?php
global $CFG, $OUTPUT, $PAGE, $DB, $USER;
require_once("../../config.php");
require_once($CFG->libdir . "/externallib.php");

use local_earlyalert\oracle_client;
use local_earlyalert\helper;
use local_earlyalert\email_report_log;

require_login(1, false);
// Check if user has access to early alert
$context = context_system::instance();


echo $OUTPUT->header();

$OCI = new oracle_client();
$OCI->connect();
$sql = "SELECT * FROM V222.VIEW_MOODLE_EARLY_ALERTS WHERE SISID=221100482";
$stid = $OCI->execute_query($sql);
echo html_writer::tag('h2', 'SIS Update Log');
$rows = array();
while (($row = oci_fetch_array($stid, OCI_ASSOC + OCI_RETURN_NULLS))) {
    $rows[] = $row;
}
if (count($rows) > 0) {
    $table = new html_table();
    $table->head = array('Run Date', 'Status', 'Details');
    foreach ($rows as $row) {
        $table->data[] = array($row['RUN_DATE'], $row['STATUS'], $row['DETAILS']);
    }
    echo html_writer::table($table);
} else {
    echo html_writer::tag('p', 'No SIS update log entries found.');
}

echo $OUTPUT->footer();


