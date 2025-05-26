<?php

namespace local_earlyalert\db;

class readonly_db {
    /** @var moodle_database|null */
    private static $instance = null;

    /**
     * Get the singleton instance of the read-only database connection.
     * @global object $CFG
     * @return moodle_database
     */
    public static function get_instance() {
        global $CFG;
        if (self::$instance === null) {
            require_once($CFG->libdir . '/dml/moodle_database.php');
            require_once($CFG->libdir . '/dml/mysqli_native_moodle_database.php');
            $db = new mysqli_native_moodle_database();
            $db->connect(
                $CFG->dbhost,
                'readonly_user',
                'readonly_password',
                $CFG->dbname,
                $CFG->dboptions
            );
            self::$instance = $db;
        }
        return self::$instance;
    }

    // Prevent instantiation
    private function __construct() {}
    private function __clone() {}
}