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
    // Add a setting to capture streams for Markham campus
    $settings->add(new admin_setting_configtextarea('earlyalert_markham_streams', get_string('markham_streams', 'local_earlyalert'), '', "MPR\nMAH\nMNO"));
    // Add a setting for showing grades or not
    $settings->add(new admin_setting_configcheckbox('earlyalert_showgrades', get_string('showgrades', 'local_earlyalert'), '', 0));
    /*Ldap server url*/
    $settings->add(new admin_setting_configtext('earlyalert_ldapurl', get_string('ldap_url', 'local_earlyalert'), '', 'ldaps://pydirectory.yorku.ca'));
    /*Ldap server user*/
    $settings->add(new admin_setting_configtext('earlyalert_ldapuser', get_string('ldap_user', 'local_earlyalert'), '', ''));
    /*Ldap server user password*/
    $settings->add(new admin_setting_configpasswordunmask('earlyalert_ldappwd', get_string('ldap_password', 'local_earlyalert'), '', ''));
    // Send emails to advisors
    $settings->add(new admin_setting_configcheckbox('earlyalert_sendemailtoadvisors', get_string('send_email_to_advisors', 'local_earlyalert'), '', 0));
    // Azure OpenAI settings
    $settings->add(new admin_setting_heading('earlyalert_azureopenai_heading', get_string('azureopenai_settings', 'local_earlyalert'), ''));
    $settings->add(new admin_setting_configtext('earlyalert_azureopenai_apikey', get_string('azureopenai_apikey', 'local_earlyalert'), '', ''));
    $settings->add(new admin_setting_configtext('earlyalert_azureopenai_endpoint', get_string('azureopenai_endpoint', 'local_earlyalert'), '', ''));
    $settings->add(new admin_setting_configtext('earlyalert_azureopenai_version', get_string('azureopenai_version', 'local_earlyalert'), '', '2024-02-15-preview'));
    $settings->add(new admin_setting_configtext('earlyalert_azureopenai_deployment', get_string('azureopenai_deployment', 'local_earlyalert'), '', ''));
    $settings->add(new admin_setting_configtext('earlyalert_showactivecourses', get_string('showactivecourses', 'local_earlyalert'), get_string('showactivecourses_desc', 'local_earlyalert'), '1'));
}
