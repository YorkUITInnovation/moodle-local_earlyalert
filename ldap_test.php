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
 $streams = explode("\n", $CFG->earlyalert_markham_streams);
print_object($LDAP->get_users_based_on_stream($streams));

//$ldapconn = ldap_connect("ldaps://pydirectory.yorku.ca");
////ldap_set_option($ldapconn, LDAP_OPT_PROTOCOL_VERSION, 3);
////ldap_set_option($ldapconn, LDAP_OPT_REFERRALS, 0);
//ldap_set_option(NULL, LDAP_OPT_DEBUG_LEVEL, 7);
//ldap_set_option($ldapconn, LDAP_OPT_X_TLS_REQUIRE_CERT, LDAP_OPT_X_TLS_NEVER);
//print_object(ldap_error($ldapconn));
//$ldapbind = ldap_bind($ldapconn, "uid=glnotes,ou=Applications,dc=yorku,dc=ca", "aolahc8T");
//
//if (!$ldapbind) {
//    echo "LDAP bind failed: " . ldap_error($ldapconn);
//} else {
//    echo "LDAP bind successful!";
//}
echo $OUTPUT->footer();