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
raise_memory_limit(MEMORY_UNLIMITED);
//echo helper::get_campus_from_stream('MPR');
//die;
try {
    raise_memory_limit(MEMORY_UNLIMITED);
    $LDAP = new ldap();
// Let's first get the profile field called
    $campus_profile_field = $DB->get_record('user_info_field', ['shortname' => 'campus']);
    if (!$campus_profile_field) {
        mtrace('Campus profile field not found.');
        return false;
    }
// Get all Markham Students
    $markham_streams = explode("\n", $CFG->earlyalert_markham_streams);
    $markham_students = $LDAP->get_users_based_on_stream($markham_streams);

    foreach ($markham_students as $student) {
        echo $student['pycyin'][0] . '<br>';
    }
    die;
    mtrace('Markham students!');
    unset($markham_streams['count']);
// Get Glendon students
    $glendon_students = $LDAP->get_users_based_on_faculty('GL'); // TODO: hardcoded GL for now

    mtrace('Glendon students!');
// Unset count
    unset($glendon_students['count']);
    $markham_students = $markham_students ?: [];
    $glendon_students = $glendon_students ?: [];
// Merge both into one array
    $merged_students = array_merge($markham_students, $glendon_students);

    if (empty($merged_students)) {
        mtrace('no students found students not found.');
        return false;
    }
    mtrace('Total students found: ' . count($merged_students));
    $student = new \stdClass();
    for ($i = 0; $i < count($merged_students); $i++) {
        if (isset($merged_students[$i]['pycyin'][0])) {
            // Only perform 220258760if student exists in Moodle
            if ($student = $DB->get_record('user', ['idnumber' => $merged_students[$i]['pycyin'][0]], 'id')) {
                // Get campus from ldap
                if (isset($merged_students[$i]['pystream'][0])) {
                    echo 'Processing ' . $merged_students[$i]['pycyin'][0] . '<br>';
                    echo 'Stream: ' . $merged_students[$i]['pystream'][0] . '<br>';
                    if ($merged_students[$i]['pystream'][0] == 'NO') {
                        $campus = helper::get_campus_from_stream('', $merged_students[$i]['pyfaculty'][0]);
                    } else {
                        if (in_array(trim(strtoupper($merged_students[$i]['pystream'][0])), array_map('strtoupper', array_map('trim', $markham_streams)))) {
                            $campus = helper::get_campus_from_stream($merged_students[$i]['pystream'][0]);
                        } else {
                            $campus = helper::get_campus_from_stream('', $merged_students[$i]['pyfaculty'][0]);
                        }

                    }
                } else {
                    $campus = helper::get_campus_from_stream('', $merged_students[$i]['pyfaculty'][0]);
                }

                echo 'Campus: ' . $campus . '<br>';
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

            } else {
                mtrace('User does not exist in Moodle: ' . $merged_students[$i]['pycyin'][0]);
                continue;
            }
        }
    }
    raise_memory_limit(MEMORY_STANDARD);
} catch (\Exception $e) {
    mtrace($e->getMessage());
    return false;
}

raise_memory_limit(MEMORY_STANDARD);
echo $OUTPUT->footer();