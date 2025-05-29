<?php

namespace local_earlyalert;

use core\notification;
use local_earlyalert\generative_ai;

class table
{
    // Private properties
    private $sql;
    private $limit = 20; // Default limit for pagination
    private $offset = 0;
    private $columns = [];
    private $headers = [];
    private $params = [];

    /**
     * Constructor for the table class.
     * Initializes the SQL query, parameters, offset, and limit.
     *
     * @param string|null $sql The SQL query to execute.
     * @param array $params Parameters for the SQL query.
     * @param int $offset Offset for pagination.
     * @param int $limit Limit for pagination.
     */
    public function __construct($sql, array $params = [], int $offset = 0, int $limit = 20)
    {
        $this->sql = $sql;
        $this->limit = $limit;
        $this->offset = $offset;
        $this->columns = $this->get_columns();
        $this->headers = $this->get_headers();
        $this->params = $params;
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

    /**
     * Executes a SQL query and returns the result as a stdClass object.
     * The object contains 'success' (boolean), 'data' (array of records), and 'error' (string, if any).
     *
     * @return \stdClass Object containing the result of the query execution.
     */
    private function execute_query(): \stdClass
    {
        global $DB;
        $result = new \stdClass();
        $result->status = 422; // Unprocessable Entity
        $result->headers = $this->headers;
        $result->data = [];
        // Basic SQL SELECT statement validation
        $sql_trimmed = ltrim($this->sql);
        if (!preg_match('/^select\s+/i', $sql_trimmed) || stripos($sql_trimmed, ' from ') === false) {
            $result->error = 'Invalid SQL: Not a valid SELECT statement.';
            return $result;
        }

        try {
            // Convert the SQL query to only have the count of records
            $count_sql = preg_replace('/^select\s+(.*?)\s+from\s+/i', 'SELECT COUNT(*) FROM ', $this->sql);
            // Get the number of total records without the limit
            $count_sql = $DB->count_records_sql($count_sql);
            $total_records = $count_sql;
            $to_limit = $this->offset + $this->limit;
            $this->sql .= " LIMIT $this->offset, $to_limit";
            $result->data = $DB->get_records_sql($this->sql, $this->params);
            $result->total_records = $total_records;
            $result->from = $this->offset;
            $result->to = $this->offset + count($result->data) - 1;
            $result->headers = $this->headers;
            $result->status = 200; // Success
        } catch (\dml_exception $e) {
            $result->error = $e->getMessage();
        }
        return $result;
    }

    public function display_table()
    {
        global $OUTPUT;
        $data = [];
        $result = $this->execute_query();

        if ($result->status == 422) {
            // If the query failed, return an error message
            return notification::error(get_string('error', 'local_earlyalert') . ': ' . $result->error);
        }

        $total_records = $result->total_records;
        $headers = [];
        $rows = [];
        $cells = [];
        // Prepare data for rendering
        // Convert the result set to an array of objects
        // Start with headers
        $h = 0;
        foreach ($this->headers as $header) {
            if ($h == 0) {
                // The first header is empty, so we skip it
                $h++;
                continue;
            }
            $headers[]['name'] = $header;
        }
        // Now the rows
        foreach ($result->data as $record) {
            $cells = [];
            $i = 0;
            foreach ($this->columns as $column) {
                // Use the column name to get the value from the record
                $value = isset($record->{$column}) ? $record->{$column} : '';
                // Add the cell to the row
                if ($i == 0) {
                    // The first cell is empty, so we skip it
                    $i++;
                    continue;
                }
                $cells[] = ['value' => $value];

                $i++;
            }
            // Add the row with cells
            $rows[] = ['cells' => $cells];

        }

        // Create pagination button array based on limit from and to
        $pagination = [];
        if ($total_records > $this->limit) {
            $limit = $result->to - $result->from + 1;
            $total_records = $result->total_records ?? 0;
            if ($limit > 0 && $total_records > 0) {
                $total_pages = (int)ceil($total_records / $limit);
                for ($i = 0;
                     $i < $total_pages;
                     $i++) {
                    $page_from = $i * $limit;
                    $pagination[] = ['label' => $i + 1,
                        'value' => $page_from];
                }

// Add next button if not on last page
                if (($result->to ?? 0) < ($total_records - 1)) {
                    $pagination[] = [
                        'label' => 'Next',
                        'value' => 1 + ($result->to ?? 0)
                    ];
                }
            }
        }
// Prepare the data array for rendering
        $data['headers'] = $headers;
        $data['rows'] = $rows;
        $data['total_records'] = $total_records;
        $data['from'] = $result->from ?? 0;
        $data['to'] = $result->to ?? 0;
        $data['pagination'] = $pagination;

        if ($result->status === 200) {
            // Convert data to array of objects
            return $OUTPUT->render_from_template('local_earlyalert/table', $data);
        } else {
            // Error notification
            return notification::error(get_string('error', 'local_earlyalert') . ': ' . $result->error);
        }
    }

    /**
     * Extracts all column names from a SQL SELECT query and returns them as an array.
     * Handles aliases (AS) and table prefixes (e.g., {user}.id AS user_id).
     *
     * @param string $sql The SQL SELECT query.
     * @return array Array of column names (using aliases if present, otherwise the column name).
     */
    public
    function extract_columns_from_sql($sql)
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
    public
    function replace_underscores_with_spaces(array $columns)
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
    public
    function split_sql_select_statement(string $sql): \stdClass
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
    public
    function get_columns_object_from_sql(string $sql): \stdClass
    {
        $columns = $this->extract_columns_from_sql($sql);
        $columns_object = new \stdClass();
        foreach ($columns as $column) {
            $columns_object->{$column} = $this->replace_underscores_with_spaces($column);
        }
        return $columns_object;
    }
}

