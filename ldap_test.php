<?php

require_once('../../config.php');

use local_earlyalert\base;
use local_earlyalert\helper;
use local_earlyalert\ldap;

global $CFG, $OUTPUT, $PAGE, $DB, $USER;

require_login(1, false);

$context = context_system::instance();

base::page(
    new moodle_url('/local/organization/campuses.php'),
    get_string('campuses', 'local_organization'),
    get_string('campuses', 'local_organization')
);

echo $OUTPUT->header();
$LDAP = new ldap();
// Let's first get the profile field called
$campus_profile_field = $DB->get_record('user_info_field', ['shortname' => 'campus']);
if (!$campus_profile_field) {
    mtrace('Campus profile field not found.');
    return false;
}
// Get all Markham Students
//$markham_streams = explode("\n", $CFG->earlyalert_markham_streams);
//$markham_students = $LDAP->get_users_based_on_stream($markham_streams);
//
//mtrace('Markham students!');
// Unset count
//unset($markham_streams['count']);
// Get Glendon students
$glendon_students = $LDAP->get_users_based_on_faculty('GL'); // TODO: hardcoded GL for now
print_object($glendon_students);

die;
mtrace('Glendon students!');
// Unset count
unset($glendon_students['count']);
$markham_students = $markham_students ?: [];
$glendon_students = $glendon_students ?: [];
// Merge both into one array
$merged_students = array_merge($markham_students, $glendon_students);
print_object($merged_students);
die;
if (empty($merged_students)) {
    mtrace('no students found students not found.');
    return false;
}
for ($i = 0; $i < count($merged_students); $i++) {
    // Get user from pyCyin number
    $student = $DB->get_record('user', ['idnumber' => $merged_students[$i]['pycyin'][0]], 'id');
    // Only perform 220258760if student exists in Moodle
    if (!$student) {
        mtrace('User does not exist in Moodle: ' . $merged_students[$i]['pycyin'][0]);
        continue;
    } else {
        // Get campus from ldap
        if (isset($merged_students[$i]['pystream'][0])) {
            $campus = helper::get_campus_from_stream($merged_students[$i]['pystream'][0]);
        } else {
            $campus = 'YK';
        }
        // Check to see if the profile data is set.
        if ($campus_data = $DB->get_record('user_info_data', ['userid' => $student->id, 'fieldid' => $campus_profile_field->id], '*')) {
            $DB->set_field('user_info_data', 'data', $campus, ['id' => $campus_data->id]);
            mtrace('Data field updated for ' . $merged_students[$i]['pycyin'][0]);
        } else {
            // Create the data field
            if (isset($student->id) && $student->id != 0) {
                $params = [
                    'userid' => $student->id,
                    'fieldid' => $campus_profile_field->id,
                    'data' => $campus,
                    'dataformat' => 0,
                ];
                $DB->insert_record('user_info_data', $params);
                mtrace('Data field inserted for ' . $merged_students[$i]['pycyin'][0]);
            }
        }
    }
}
echo $OUTPUT->footer();