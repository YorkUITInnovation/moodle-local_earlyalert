<?php
// This file is part of Moodle - https://moodle.org/

require_once(__DIR__ . '/../../../../config.php');
require_once($CFG->libdir . '/externallib.php');

use local_earlyalert\generative_ai;
use local_earlyalert\table;

class local_earlyalert_report_generation_ws extends external_api {

    /**
     * Returns the description of the parameters for the execute function.
     * @return external_function_parameters
     */
    public static function execute_parameters() {
        return new external_function_parameters([
            'prompt' => new external_value(PARAM_TEXT, 'Prompt for the AI', VALUE_REQUIRED),
        ]);
    }

    /**
     * Executes the AI generation based on the provided prompt.
     *
     * @param string $prompt The prompt to send to the AI.
     * @return array The results from the AI, specifically the SQL query.
     * @throws \moodle_exception
     */
    public static function execute($prompt) {
        global $CFG, $USER;
        self::validate_parameters(self::execute_parameters(), ['prompt' => $prompt]);
        // Call the generative_ai class to get the results
        $GENAI = new generative_ai(
            $CFG->earlyalert_azureopenai_apikey,
            $CFG->earlyalert_azureopenai_endpoint,
            $CFG->earlyalert_azureopenai_version,
            $CFG->earlyalert_azureopenai_deployment
        );
        $message = $GENAI->create_message($prompt);
        $results = $GENAI->execute($message);
        $results = json_decode($results, true);
        $query = table::beautify_sql($results['query']);

        return [
            'results' => $query
        ];
    }

    /**
     * Returns the description of the return values for the execute function.
     * @return external_single_structure
     */
    public static function execute_returns() {
        return new external_single_structure([
            'results' => new external_value(PARAM_RAW, 'Results from generative_ai'),
        ]);
    }

    /**
     * Returns the description of the parameters for the get_table function.
     * @return external_function_parameters
     */
    public static function get_table_parameters() {
        return new external_function_parameters([
            'query' => new external_value(PARAM_RAW, 'SQL query to execute', VALUE_REQUIRED),
            'params' => new external_value(PARAM_RAW, 'Parameters for the SQL query in JSON format', VALUE_DEFAULT, ''),
            'offset' => new external_value(PARAM_INT, 'Offset for pagination', VALUE_DEFAULT, 0),
            'limit' => new external_value(PARAM_INT, 'Limit for pagination', VALUE_DEFAULT, 20),
        ]);
    }

    /**
     * Executes the SQL query and returns the results in a table format.
     * @param $query
     * @param $params
     * @param $offset
     * @param $limit
     * @return array
     * @throws invalid_parameter_exception
     */
    public static function get_table($query, $params = '', $offset = 0, $limit = 20) {
        global $PAGE;

        self::validate_parameters(self::get_table_parameters(), [
            'query' => $query,
            'params' => $params,
            'offset' => $offset,
            'limit' => $limit
        ]);

        $context = context_system::instance();
        require_login(1, false);

        $params = json_decode($params, true);
        // Execute the query and return the results
        $TABLE = new table($query, $params, $offset, $limit);
        file_put_contents('/var/www/moodledata/temp/debug_query.txt', print_r($TABLE, true));
        // Get Table HTML
        $results = $TABLE->display_table();
file_put_contents('/var/www/moodledata/temp/debug.html', $results);
        return [
            'table' => $results
        ];
    }

    /**
     * Returns the description of the return values for the get_table function.
     * @return external_single_structure
     */
    public static function get_table_returns() {
        return new external_single_structure([
            'table' => new external_value(PARAM_RAW, 'HTML table with the results of the query'),
        ]);
    }
}

