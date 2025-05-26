<?php

namespace local_earlyalert\tables;

require_once('../../config.php');
require_once($CFG->libdir . '/tablelib.php');


class reports_table extends \table_sql
{

    protected $showDelButtons = false;
    /**
     * grade_table constructor.
     * @param $uniqueid
     */
    public function __construct($uniqueid, string $sql_query)
    {
        GLOBAL $USER;
        parent::__construct($uniqueid);

        // Define the columns to be displayed
        $columns = $this->extract_columns_from_sql($sql_query);
        $this->define_columns($columns);

        // Define the headers for the columns
        $headers = $this->replace_underscores_with_spaces($columns);
        $this->define_headers($headers);
    }

    /**
     * Extracts all column names from a SQL SELECT query and returns them as an array.
     * Handles aliases (AS) and table prefixes (e.g., {user}.id AS user_id).
     *
     * @param string $sql The SQL SELECT query.
     * @return array Array of column names (using aliases if present, otherwise the column name).
     */
    public function extract_columns_from_sql(string $sql) {
        $columns = [];
        // Match the SELECT ... FROM part
        if (preg_match('/select\s+(.*?)\s+from\s+/is', $sql, $matches)) {
            $select_part = $matches[1];
            // Split by comma, but not inside parentheses
            $fields = preg_split('/,(?![^\(]*\))/i', $select_part);
            foreach ($fields as $field) {
                $field = trim($field);
                // Match alias (AS ...)
                if (preg_match('/\s+as\s+([`\w]+)/i', $field, $alias_match)) {
                    $columns[] = $alias_match[1];
                } else {
                    // Remove table prefix and curly braces
                    $field = preg_replace('/^\{?\w+\}?\./', '', $field);
                    // Remove backticks and whitespace
                    $field = trim($field, "` ");
                    $columns[] = $field;
                }
            }
        }
        return $columns;
    }

    /**
     * Replaces all underscores with spaces in each string of the input array.
     * @param array $array The input array of strings.
     * @return array The array with underscores replaced by spaces.
     */
    public function replace_underscores_with_spaces(array $array) {
        $result = [];
        foreach ($array as $item) {
            $result[] = str_replace('_', ' ', $item);
        }
        return $result;
    }

    /**
     * Separates an SQL SELECT statement into fields, from (including joins), and where conditions.
     * Removes the keywords SELECT, FROM, and WHERE. Returns an array with keys: fields, from, where.
     *
     * @param string $sql The SQL SELECT query.
     * @return array Associative array with keys 'fields', 'from', and 'where'.
     */
    public function split_sql_select_statement(string $sql): \stdClass {
        $result = new \stdClass();
        $result->fields = '';
        $result->from = '';
        $result->where = '';
        // Normalize whitespace and remove line breaks
        $sql = preg_replace('/\s+/', ' ', trim($sql));
        // Extract fields, from, and where
        $pattern = '/select\s+(.*?)\s+from\s+(.*?)(?:\s+where\s+(.*))?$/is';
        if (preg_match($pattern, $sql, $matches)) {
            $result->fields = trim($matches[1]);
            $result->from = isset($matches[2]) ? trim($matches[2]) : '';
            $result->where = isset($matches[3]) ? trim($matches[3]) : '';
        }
        return $result;
    }
}
