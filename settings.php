<?php
defined('MOODLE_INTERNAL') || die;

defined('MOODLE_INTERNAL') || die();

if ($hassiteconfig) {
    $settings = new admin_settingpage('local_earlyalert', get_string('pluginname', 'local_earlyalert'));
    $ADMIN->add('localplugins', $settings);
    $settings->add(new admin_setting_heading('earlyalert_heading', get_string('pluginname', 'local_earlyalert'), ''));
    /*Ldap server url*/
    $settings->add(new admin_setting_configtext('earlyalert_ldapurl', get_string('ldap_url', 'local_earlyalert'), '', 'ldaps://pydirectory.yorku.ca'));
    /*Ldap server user*/
    $settings->add(new admin_setting_configtext('earlyalert_ldapuser', get_string('ldap_user', 'local_earlyalert'), '', ''));
    /*Ldap server user password*/
    $settings->add(new admin_setting_configpasswordunmask('earlyalert_ldappwd', get_string('ldap_password', 'local_earlyalert'), '', ''));
}