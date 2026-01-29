<?php
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Plugin administration pages are defined here.
 *
 * @package     local_earlyalert
 * @copyright   2024 York University <itinnovation@yorku.ca>
 * @license     https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

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
    $settings->add(new admin_setting_configcheckbox('earlyalert_showactivecourses', get_string('showactivecourses', 'local_earlyalert'), get_string('showactivecourses_desc', 'local_earlyalert'), '1'));
    // Azure OpenAI settings for AI Analytics Assistant
    $settings->add(new admin_setting_heading('earlyalert_azureopenai_heading', get_string('azureopenai_settings', 'local_earlyalert'), get_string('azureopenai_settings_desc', 'local_earlyalert')));
    $settings->add(new admin_setting_configtext('earlyalert_azureopenai_apikey', get_string('azureopenai_apikey', 'local_earlyalert'), get_string('azureopenai_apikey_desc', 'local_earlyalert'), ''));
    $settings->add(new admin_setting_configtext('earlyalert_azureopenai_endpoint', get_string('azureopenai_endpoint', 'local_earlyalert'), get_string('azureopenai_endpoint_desc', 'local_earlyalert'), ''));
    $settings->add(new admin_setting_configtext('earlyalert_azureopenai_deployment', get_string('azureopenai_deployment', 'local_earlyalert'), get_string('azureopenai_deployment_desc', 'local_earlyalert'), ''));
    $settings->add(new admin_setting_configtext('earlyalert_azureopenai_version', get_string('azureopenai_version', 'local_earlyalert'), get_string('azureopenai_version_desc', 'local_earlyalert'), '2024-08-01-preview'));

}
