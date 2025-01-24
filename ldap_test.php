<?php

require_once('../../config.php');

use local_earlyalert\base;
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

 $student = $LDAP->get_student_info(221516075);
print_object($student);
echo $OUTPUT->footer();