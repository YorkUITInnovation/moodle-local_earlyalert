<?php

require_once($CFG->libdir . "/externallib.php");
require_once("$CFG->dirroot/config.php");

use local_organization\users;

class local_earlyalert_users_ws extends external_api
{
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
        $params = self::validate_parameters(self::get_users_parameters(), array('search' => $search));
        if (strlen($search) >= 3) {
            $sql = "select * from {user} u where ";
            $name = str_replace(' ', '%', $search);
            $sql .= " (Concat(u.firstname, ' ', u.lastname ) like '%$search%' or (u.idnumber like '%$search%') or (u.email like '%$search%') or (u.username like '%$search%'))";
            //How the ajax call with search via the form autocomplete
            $sql .= " Order by u.lastname";
            //How the ajax call with search via the form autocomplete
            $mdl_users = $DB->get_records_sql($sql, array($search));
        }
        else {
            //            $sql = "select * from {user} Order By lastname"; $mdlUsers = [];
        }
        $users = [];
        $i = 0;
        foreach ($mdl_users as $u) {
            $users[$i]['value'] = $u->id;
            $users[$i]['label'] = $u->firstname . ' ' . $u->lastname . ' - ' . $u->email . ' (' . $u->idnumber . ')';
            $i++;
        }
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