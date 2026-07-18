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
 * Web service for users functionality.
 *
 * @package     local_earlyalert
 * @copyright   2024 York University <itinnovation@yorku.ca>
 * @license     https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . "/externallib.php");

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_value;
use core_external\external_single_structure;
use core_external\external_multiple_structure;
use local_organization\users;

/**
 * Users web service class.
 */
class local_earlyalert_users_ws extends external_api {
    /**
     * Returns users parameters
     * @return external_function_parameters
     **/

    public static function get_users_parameters() {
        return new external_function_parameters(
            array(
                'search' => new external_value(PARAM_TEXT, 'User first or last name or idnumber or email', false)
            )
        );
    }

    /** Returns users
     * @global moodle_database $DB
     * @return string users
     **/

    public static function get_users($search="") {
        global $DB;
        raise_memory_limit(MEMORY_UNLIMITED);
        $params = self::validate_parameters(self::get_users_parameters(), array('search' => $search));
        $mdl_users = [];
        if (strlen($search) >= 3) {
            $searchparam = '%' . $DB->sql_like_escape($search) . '%';
            $nameparam   = '%' . $DB->sql_like_escape(str_replace(' ', '%', $search)) . '%';
            $sql = "SELECT * FROM {user} u WHERE u.deleted = 0 AND (
                " . $DB->sql_like('u.firstname', ':firstname', false) . "
                OR " . $DB->sql_like('u.lastname', ':lastname', false) . "
                OR " . $DB->sql_like($DB->sql_fullname('u.firstname', 'u.lastname'), ':fullname', false) . "
                OR " . $DB->sql_like('u.idnumber', ':idnumber', false) . "
                OR " . $DB->sql_like('u.email', ':email', false) . "
            ) ORDER BY u.lastname, u.firstname";
            $mdl_users = $DB->get_records_sql($sql, [
                'firstname'  => $searchparam,
                'lastname'   => $searchparam,
                'fullname'   => $nameparam,
                'idnumber'   => $searchparam,
                'email'      => $searchparam,
            ], 0, 50);
        }
        $users = [];
        $i = 0;
        foreach ($mdl_users as $u) {
            $users[$i]['value'] = $u->id;
            $users[$i]['label'] = $u->firstname . ' ' . $u->lastname . ' - ' . $u->email . ' (' . $u->idnumber . ')';
            $i++;
        }
        raise_memory_limit(MEMORY_STANDARD);
        return $users;
    }

    /** Get Users
     * @return single_structure_description
     **/

    public static function user_details() {
        $fields = array(
            'value' => new external_value(PARAM_INT, 'Record id', false),
            'label' => new external_value(PARAM_TEXT, 'User information', true)
        );
        return new external_single_structure($fields);
    }

    /** Returns users result value
     *  @return external_description
     **/
    public static function get_users_returns() {
        return new external_multiple_structure(self::user_details());
    }
}