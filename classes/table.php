<?php

namespace local_earlyalert;

use local_earlyalert\generative_ai;

class table
{
    // Private properties
    private $sql;
    private $from;
    private $to;
    private $columns = [];
    private $headers = [];

    /**
     * Constructor for the table class.
     *
     * @param string $sql The SQL query to be executed.
     * @param int $from The starting index for pagination (default is 0).
     * @param int $to The ending index for pagination (default is 20).
     */
    public function __construct(string $sql, int $from = 0, int $to = 20)
    {
        $this->sql = $sql;
        $this->from = $from;
        $this->to = $to;
        $this->columns = $this->get_columns();
        $this->headers = $this->get_headers();
    }

    private function get_columns(): array
    {
        // Extract columns from the SQL query
        $columns = $this->extract_columns_from_sql($this->sql);
        return $columns;
    }

    private function get_headers(): array
    {
        $headers = $this->replace_underscores_with_spaces($this->columns);
        return $headers;
    }

    public function set_columns(array $columns): void
    {
        $this->columns = $columns;
    }


    /**
     * Executes a SQL query and returns the result as a stdClass object.
     * The object contains 'success' (boolean), 'data' (array of records), and 'error' (string, if any).
     *
     * @param string $sql The SQL query to execute.
     * @param array $params Parameters for the SQL query.
     * @return \stdClass Object containing the result of the query execution.
     */
    public function execute_query(string $sql, array $params =[]): \stdClass
    {
        global $DB;
        $result = new \stdClass();
        $result->success = false;
        $result->data = [];
        try {
            $result->data = $DB->get_records_sql($sql, $params);
            $result->headers = $this->headers;
            $result->success = true;
        } catch (\dml_exception $e) {
            $result->error = $e->getMessage();
        }
        return $result;
    }

    /**
     * Extracts all column names from a SQL SELECT query and returns them as an array.
     * Handles aliases (AS) and table prefixes (e.g., {user}.id AS user_id).
     *
     * @param string $sql The SQL SELECT query.
     * @return array Array of column names (using aliases if present, otherwise the column name).
     */
    public function extract_columns_from_sql(string $sql)
    {
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
    public function replace_underscores_with_spaces(array $columns)
    {
        $result = [];
        foreach ($columns as $item) {
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
    public function split_sql_select_statement(string $sql): \stdClass
    {
        $result = new \stdClass();
        $result->fields = '';
        $result->from = '';
        $result->where = '';
        $result->order = '';
        $result->limit = '';
        // Normalize whitespace and remove line breaks
        $sql = preg_replace('/\s+/', ' ', trim($sql));
        // Extract fields, from, where, order, and limit
        $pattern = '/select\s+(.*?)\s+from\s+(.*?)(?:\s+where\s+(.*?))?(?:\s+order\s+by\s+(.*?))?(?:\s+limit\s+(.*))?$/is';
        if (preg_match($pattern, $sql, $matches)) {
            // Remove aliases from the fields string (e.g., 'u.firstname AS user_firstname' => 'firstname')
            $fields = trim($matches[1]);
            $fieldparts = preg_split('/,(?![^\(]*\))/i', $fields);
            $cleanfields = [];
            foreach ($fieldparts as $field) {
                // Remove alias (AS ...)
                if (preg_match('/^(.*?)\s+as\s+.+$/i', trim($field), $fieldmatch)) {
                    $field = trim($fieldmatch[1]);
                }
                // Remove table/alias prefix and curly braces
                $field = preg_replace('/^\{?\w+\}?\./', '', $field);
                // Remove backticks and whitespace
                $field = trim($field, "` ");
                $cleanfields[] = $field;
            }
            $result->fields = implode(', ', $cleanfields);
            $result->from = isset($matches[2]) ? trim($matches[2]) : '';
            $result->where = isset($matches[3]) ? trim($matches[3]) : '';
            $result->order = isset($matches[4]) ? trim($matches[4]) : '';
            $result->limit = isset($matches[5]) ? trim($matches[5]) : '';
        }
        return $result;
    }

    /**
     * Return a stdClass object with the columns and column name
     * @param string $sql The SQL SELECT query.
     */
    public function get_columns_object_from_sql(string $sql): \stdClass
    {
        $columns = $this->extract_columns_from_sql($sql);
        $columns_object = new \stdClass();
        foreach ($columns as $column) {
            $columns_object->{$column} = $this->replace_underscores_with_spaces($column);
        }
        return $columns_object;
    }
}