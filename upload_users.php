<?php

require_once('../../config.php');

use local_earlyalert\base;
use local_earlyalert\helper;
use local_earlyalert\ldap;

global $CFG, $OUTPUT, $PAGE, $DB, $USER;

require_login(1, false);

$context = context_system::instance();
$from = optional_param('from', 1, PARAM_INT);
$to = optional_param('to', 10, PARAM_INT);
base::page(
    new moodle_url('/local/organization/campuses.php'),
    get_string('campuses', 'local_organization'),
    get_string('campuses', 'local_organization')
);

function parse_csv($file_path)
{
    $header = [];
    $data = [];

    if (($handle = fopen($file_path, 'r')) !== false) {
        // Get the header row
        if (($header = fgetcsv($handle, 1000, ',')) !== false) {

        }

        // Read the data rows
        while (($row = fgetcsv($handle, 1000, ',')) !== false) {
            $data[] = array_combine($header, $row);
        }

        fclose($handle);
    }

    return $data;
}


echo $OUTPUT->header();
raise_memory_limit(MEMORY_UNLIMITED);
for ($i = $from; $i < $to; $i++) {
    ob_start();
    $data = parse_csv('data_part_' . $i. '.csv');
    ob_flush();
    flush();
    print_object(count($data));
    foreach ($data as $rows) {
        echo 'Processing row ' . $i . '<br>';
        // first check if teh user exists based on the idnumber
        $user = $DB->get_record('user', ['idnumber' => $rows['idnumber']]);
        echo 'User found with id ' . $user->id . '<br>';
        if (!$user) {
            // Create user based on columns username through country
            $user = new stdClass();
            $user->username = $rows['username'] ? $rows['username'] : $rows['idnumber'];
            $user->auth = 'saml2';
            $user->firstname = $rows['firstname'];
            $user->lastname = $rows['lastname'];
            $user->email = $rows['email'];
            $user->idnumber = $rows['idnumber'];
            $user->city = $rows['city'];
            $user->country = $rows['country'];
            $user->lang = 'en';
            $user->confirmed = 1;
            $user->mnethostid = 1;
            $user->timecreated = time();
            $newuserid = $DB->insert_record('user', $user);
            echo 'User created with id ' . $newuserid . '(' . $rows['idnumber'] . ')<br>';
            $user = $DB->get_record('user', ['id' => $newuserid]);
        }


        $faculty_profile_field = $DB->get_record('user_info_field', ['shortname' => 'ldapfaculty']);
        $major_profile_field = $DB->get_record('user_info_field', ['shortname' => 'ldapmajor']);

        $faculty_data = $DB->get_record('user_info_data', ['userid' => $user->id, 'fieldid' => $faculty_profile_field->id]);
        $major_data = $DB->get_record('user_info_data', ['userid' => $user->id, 'fieldid' => $major_profile_field->id]);


        // If the faculty data is not set, then we need to create the faculty profile field
        if (!$faculty_data) {
            $faculty_data = new stdClass();
            $faculty_data->userid = $user->id;
            $faculty_data->fieldid = $faculty_profile_field->id;
            $faculty_data->data = $rows['profile_field_ldapfaculty'];
            $faculty_data->dataformat = 0;
            $faculty_data->data = $DB->insert_record('user_info_data', $faculty_data);
            echo 'Faculty data created for ' . $user->id . '(' . $user->idnumber . ')<br>';
        } else {
            $params = [
                'userid' => $user->id,
                'fieldid' => $faculty_profile_field->id,
                'data' => $rows['profile_field_ldapfaculty'],
                'dataformat' => 0,
            ];
            $DB->set_field('user_info_data', 'data', $rows['profile_field_ldapfaculty'], ['id' => $faculty_data->id]);
            echo 'Faculty data updated for ' . $user->id . '(' . $user->idnumber . ')<br>';
        }

        // If the major data is not set, then we need to create the major profile field
        if (!$major_data) {
            $major_data = new stdClass();
            $major_data->userid = $user->id;
            $major_data->fieldid = $major_profile_field->id;
            $major_data->data = $rows['profile_field_ldapmajor'];
            $major_data->dataformat = 0;
            $major_data->data = $DB->insert_record('user_info_data', $major_data);
            echo 'Major data created for ' . $user->id . '<br>';
        } else {
            $DB->set_field('user_info_data', 'data', $rows['profile_field_ldapmajor'], ['id' => $major_data->id]);
            echo 'Major data updated for ' . $user->id . '(' . $user->idnumber . ')<br>';
        }
        ob_flush();
        flush();
    }
}

raise_memory_limit(MEMORY_STANDARD);

echo $OUTPUT->footer();