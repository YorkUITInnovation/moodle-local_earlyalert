<?php
require_once(__DIR__ . '/../../config.php');
require_once($CFG->dirroot . '/local/earlyalert/classes/oracle_client.php');

require_login();
require_admin(); // Ensure only admins can run this.

global $DB, $OUTPUT, $PAGE;

$PAGE->set_url('/local/earlyalert/import_studentprofile_sis.php');
$PAGE->set_context(context_system::instance());
$PAGE->set_title('Import Student Profiles from SIS');
$PAGE->set_heading('Import Student Profiles from SIS');

echo $OUTPUT->header();
echo $OUTPUT->heading('Early Alert: Student Profile Import Script');

// 1. Delete logs before September 3rd, 2025.
$deletedate = strtotime('2025-09-03 00:00:00');
echo html_writer::tag('p', "Deleting log records created before: " . userdate($deletedate));

$count = $DB->count_records_select('local_earlyalert_report_log', 'timecreated < ?', [$deletedate]);
if ($count > 0) {
    $DB->delete_records_select('local_earlyalert_report_log', 'timecreated < ?', [$deletedate]);
    echo html_writer::tag('p', "Successfully deleted {$count} old log records.");
} else {
    echo html_writer::tag('p', "No old log records to delete.");
}

// 2. Fetch remaining logs to update them.
echo html_writer::tag('h3', "\nFetching remaining log records to update student profiles...", ['style' => 'margin-top: 20px;']);
$logs = $DB->get_records('local_earlyalert_report_log');
if (empty($logs)) {
    echo html_writer::tag('p', "No log records found to update. Exiting.");
    echo $OUTPUT->footer();
    exit(0);
}
$total_logs = count($logs);
echo html_writer::tag('p', "Found {$total_logs} records to process.");

// 3. Connect to Oracle SIS database.
echo html_writer::tag('h3', "\nConnecting to Oracle SIS database...", ['style' => 'margin-top: 20px;']);
// Instantiate without credentials, assuming the class handles them.
try {
    $OCI = new \local_earlyalert\oracle_client();
    $OCI->connect();
    echo html_writer::tag('p', "Successfully connected to Oracle.", ['class' => 'alert alert-success']);
} catch (\Exception $e) {
    echo html_writer::tag('p', "ERROR: Failed to connect to Oracle SIS database: " . htmlspecialchars($e->getMessage()), ['class' => 'alert alert-danger']);
    echo html_writer::tag('p', "Cannot proceed with profile import. Please check Oracle connection settings.", ['class' => 'alert alert-warning']);
    echo $OUTPUT->footer();
    exit(1);
}

// 4. Iterate and update records.
$updated_count = 0;
$not_found_count = 0;
$no_idnumber_count = 0;
$not_found_users = [];

echo html_writer::tag('h3', "\nStarting profile update process...", ['style' => 'margin-top: 20px;']);
echo html_writer::start_tag('ul');

foreach ($logs as $log) {
    if (empty($log->target_user_id)) {
        continue;
    }

    // Get user from Moodle DB to find their idnumber (SIS ID).
    $user = $DB->get_record('user', ['id' => $log->target_user_id]);

    if (!$user || empty(trim($user->idnumber))) {
        $no_idnumber_count++;
        continue;
    }

    $sisid = trim($user->idnumber);

    // Query Oracle for the student's profile.
    try {
        $sql = "SELECT * FROM V222.VIEW_MOODLE_EARLY_ALERTS WHERE SISID=:sisid";
        $oracle_params = [':sisid' => $sisid];
        $sis_profile_data = $OCI->execute_query($sql, $oracle_params);

        if (!empty($sis_profile_data[0])) {
            // Profile found, update the log record.
            // Create an object with only the fields to update for a more targeted query.
            $record_to_update = new stdClass();
            $record_to_update->id = $log->id;
            $record_to_update->student_profile = json_encode($sis_profile_data[0]);
            $record_to_update->timemodified = time();
            $DB->update_record('local_earlyalert_report_log', $record_to_update);
            $updated_count++;
        } else {
            // Profile not found in SIS - edge case.
            $not_found_count++;
            $not_found_users[] = $user;
        }
    } catch (\Exception $e) {
        // Log the error and continue with next record
        error_log('Early Alert Import - Failed to query SIS for student ID ' . $log->target_user_id .
                 ' (idnumber: ' . $sisid . '): ' . $e->getMessage());
        $not_found_count++;
        $not_found_users[] = $user;
    }
}

echo html_writer::end_tag('ul');

echo html_writer::tag('h2', "\n\nUpdate process finished.", ['style' => 'margin-top: 20px;']);
$summary = html_writer::start_tag('div', ['class' => 'card']);
$summary .= html_writer::tag('h3', 'Summary', ['class' => 'card-header']);
$summary .= html_writer::start_tag('div', ['class' => 'card-body']);
$summary .= html_writer::tag('p', "Total records processed: {$total_logs}");
$summary .= html_writer::tag('p', "Successfully updated: {$updated_count}");
$summary .= html_writer::tag('p', "Profiles not found in SIS: {$not_found_count}");
$summary .= html_writer::tag('p', "Moodle users without an ID number: {$no_idnumber_count}");
$summary .= html_writer::end_tag('div');
$summary .= html_writer::end_tag('div');
echo $summary;

if (!empty($not_found_users)) {
    echo html_writer::tag('h3', 'Moodle Users Not Found in SIS', ['style' => 'margin-top: 20px;']);
    echo html_writer::start_tag('table', ['class' => 'table table-striped']);
    echo html_writer::start_tag('thead');
    echo html_writer::start_tag('tr');
    echo html_writer::tag('th', 'Moodle ID');
    echo html_writer::tag('th', 'Username');
    echo html_writer::tag('th', 'ID Number (SIS ID)');
    echo html_writer::tag('th', 'Full Name');
    echo html_writer::end_tag('tr');
    echo html_writer::end_tag('thead');
    echo html_writer::start_tag('tbody');
    foreach ($not_found_users as $user) {
        echo html_writer::start_tag('tr');
        echo html_writer::tag('td', $user->id);
        echo html_writer::tag('td', htmlspecialchars($user->username));
        echo html_writer::tag('td', htmlspecialchars($user->idnumber));
        echo html_writer::tag('td', htmlspecialchars(fullname($user)));
        echo html_writer::end_tag('tr');
    }
    echo html_writer::end_tag('tbody');
    echo html_writer::end_tag('table');
}

echo $OUTPUT->footer();
exit(0);
