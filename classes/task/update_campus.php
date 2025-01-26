<?php

/**
 * A scheduled task for early alerts
 *
 * @package    local_earlyalert
 */

namespace local_earlyalert\task;


global $CFG;


use local_earlyalert\ldap;
use local_earlyalert\helper;

defined('MOODLE_INTERNAL') || die();

/**
 * The main scheduled task for the Early Alerts plugin
 *
 * @package    local_earlyalert
 */
class update_campus extends \core\task\scheduled_task
{

    /**
     * Get a descriptive name for this task (shown to admins).
     *
     * @return string
     */
    public function get_name()
    {
        return get_string('update_campus', 'local_earlyalert');
    }

    /**
     * Execute the scheduled task.
     */
    public function execute()
    {
        global $DB, $CFG;

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

        return true;
    }
}
