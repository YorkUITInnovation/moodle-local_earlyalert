<?php
defined('MOODLE_INTERNAL') || die();

if ($hassiteconfig) {

    $ADMIN->add('localplugins', new admin_category('earlyalert', get_string('pluginname', 'local_earlyalert')));

    $settings = new admin_externalpage('local_earlyalert',
        get_string('adashboard', 'local_earlyalert', null, true),
        new moodle_url('/local/earlyalert/dashboard.php'));

    $ADMIN->add('earlyalert', $settings);


    $settings = new admin_settingpage('local_earlyalert_settings', get_string('pluginsettings', 'local_earlyalert'));
    $ADMIN->add('earlyalert', $settings);
    $settings->add(new admin_setting_heading('earlyalert_heading', get_string('pluginname', 'local_earlyalert'), ''));
    // Add a setting for showing grades or not
    $settings->add(new admin_setting_configcheckbox('earlyalert_showgrades', get_string('showgrades', 'local_earlyalert'), '', 0));
    /*Ldap server url*/
    $settings->add(new admin_setting_configtext('earlyalert_ldapurl', get_string('ldap_url', 'local_earlyalert'), '', 'ldaps://pydirectory.yorku.ca'));
    /*Ldap server user*/
    $settings->add(new admin_setting_configtext('earlyalert_ldapuser', get_string('ldap_user', 'local_earlyalert'), '', ''));
    /*Ldap server user password*/
    $settings->add(new admin_setting_configpasswordunmask('earlyalert_ldappwd', get_string('ldap_password', 'local_earlyalert'), '', ''));
    
}
