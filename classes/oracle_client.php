<?php
// This file is part of Moodle - http://moodle.org/
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
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

namespace local_earlyalert;

//defined('MOODLE_INTERNAL') || die();

/**
 * Simple Oracle DB client for connecting and executing queries using OCI8.
 *
 * Connection parameters default to the existing yorktasks SIS settings:
 *  - $CFG->yorktasks_sisuser
 *  - $CFG->yorktasks_sispass
 *  - $CFG->yorktasks_sisconnstring
 *
 * This class is intentionally minimal and based on the existing procedural
 * implementation used in update_sis_dates() inside lib.php.
 */
class oracle_client {
    /** @var resource|null */
    protected $conn = null;

    /** @var string */
    protected $user;
    /** @var string */
    protected $pass;
    /** @var string */
    protected $connstring;

    /**
     * Constructor.
     *
     * @param string|null $user Oracle username; defaults to $CFG->yorktasks_sisuser
     * @param string|null $pass Oracle password; defaults to $CFG->yorktasks_sispass
     * @param string|null $connstring Oracle connection string (EZCONNECT/TNS); defaults to $CFG->yorktasks_sisconnstring
     */
    public function __construct($user = null, $pass = null, $connstring = null) {
        global $CFG;
        $this->user = isset($user) ? $user : (isset($CFG->yorktasks_sisuser) ? $CFG->yorktasks_sisuser : '');
        $this->pass = isset($pass) ? $pass : (isset($CFG->yorktasks_sispass) ? $CFG->yorktasks_sispass : '');
        $this->connstring = isset($connstring) ? $connstring : (isset($CFG->yorktasks_sisconnstring) ? $CFG->yorktasks_sisconnstring : '');
    }

    /**
     * Establishes the OCI connection if not already connected.
     *
     * @throws \Exception on failure
     * @return void
     */
    public function connect() {
        if ($this->conn) {
            return;
        }
        $this->conn = @oci_connect($this->user, $this->pass, $this->connstring);
        if (!$this->conn) {
            $e = oci_error();
            $message = isset($e['message']) ? $e['message'] : 'Unknown Oracle connection error';
            throw new \Exception('Oracle connect failed: ' . $message);
        }
    }

    /**
     * Prepares and executes a SQL statement with optional binds and returns the OCI statement.
     * Caller may fetch rows using oci_fetch_* or use execute_query() helper.
     *
     * @param string $sql
     * @param array $binds Associative array of binds [':name' => value] or ['name' => value]
     * @throws \Exception on failure
     * @return resource OCI statement resource
     */
    public function prepare_and_execute($sql, $binds = array()) {
        $this->connect();
        $stid = @oci_parse($this->conn, $sql);
        if (!$stid) {
            $e = oci_error($this->conn);
            $message = isset($e['message']) ? $e['message'] : 'Unknown Oracle parse error';
            throw new \Exception('Oracle parse failed: ' . $message);
        }
        // Bind parameters if provided.
        if (!empty($binds)) {
            foreach ($binds as $name => $value) {
                $bindname = (strpos($name, ':') === 0) ? $name : (':' . $name);
                // Use a variable to ensure by-reference binding works as expected.
                $var = $value;
                if (!@oci_bind_by_name($stid, $bindname, $var)) {
                    $e = oci_error($stid);
                    $message = isset($e['message']) ? $e['message'] : 'Unknown Oracle bind error';
                    throw new \Exception('Oracle bind failed for ' . $bindname . ': ' . $message);
                }
            }
        }
        if (!@oci_execute($stid)) {
            $e = oci_error($stid);
            $message = isset($e['message']) ? $e['message'] : 'Unknown Oracle execute error';
            throw new \Exception('Oracle execute failed: ' . $message);
        }
        return $stid;
    }

    /**
     * Executes a SELECT-like query and returns all rows as associative arrays.
     * NULLs are preserved (OCI_RETURN_NULLS).
     *
     * @param string $sql
     * @param array $binds
     * @throws \Exception
     * @return array
     */
    public function execute_query($sql, $binds = array()) {
        $stid = $this->prepare_and_execute($sql, $binds);
        $rows = array();
        while ($row = oci_fetch_array($stid, OCI_ASSOC + OCI_RETURN_NULLS)) {
            $rows[] = $row;
        }
        oci_free_statement($stid);
        return $rows;
    }

    /**
     * Executes a DML statement (INSERT/UPDATE/DELETE). Returns the number of affected rows if available.
     *
     * @param string $sql
     * @param array $binds
     * @throws \Exception
     * @return int Number of affected rows if detectable, otherwise 0
     */
    public function execute_non_query($sql, $binds = array()) {
        $stid = $this->prepare_and_execute($sql, $binds);
        $count = oci_num_rows($stid);
        oci_free_statement($stid);
        return (int)$count;
    }

    /**
     * Closes the connection.
     *
     * @return void
     */
    public function close() {
        if ($this->conn) {
            @oci_close($this->conn);
            $this->conn = null;
        }
    }

    /**
     * Destructor to ensure the connection is closed.
     */
    public function __destruct() {
        $this->close();
    }
}
