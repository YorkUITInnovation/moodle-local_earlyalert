<?php
/**
 * Environment configuration endpoint for React dashboard
 * Returns Azure OpenAI configuration from Moodle settings
 *
 * This file is part of Moodle - https://moodle.org/
 *
 * Moodle is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Moodle is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Moodle.  If not, see <https://www.gnu.org/licenses/>.
 *
 * @package    local_earlyalert
 * @copyright  2024 onwards York University (https://yorku.ca)
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// Prevent any output before JSON
ob_start();

// Include Moodle config
require_once(__DIR__ . '/../../../../config.php');

// Require login - ensures only authenticated users can access
require_login();

global $CFG;

// Clear any buffered output and set JSON headers
ob_end_clean();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

try {
    // Retrieve Azure OpenAI settings from Moodle configuration
    $apiKey = $CFG->earlyalert_azureopenai_apikey;
    $endpoint = $CFG->earlyalert_azureopenai_endpoint;
    $deployment = $CFG->earlyalert_azureopenai_deployment;
    $version = $CFG->earlyalert_azureopenai_version;

    // Set defaults if not configured
    if (empty($version)) {
        $version = '2024-08-01-preview';
    }

    // Prepare response
    $config = [
        'success' => true,
        'azure_openai' => [
            'api_key' => $apiKey ?: '',
            'endpoint' => $endpoint ?: '',
            'deployment_name' => $deployment ?: '',
            'api_version' => $version
        ],
        'configured' => !empty($apiKey) && !empty($endpoint) && !empty($deployment),
        'timestamp' => time()
    ];

    // Return JSON response
    http_response_code(200);
    echo json_encode($config, JSON_UNESCAPED_SLASHES);

} catch (Exception $e) {
    // Return error response
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'azure_openai' => [
            'api_key' => '',
            'endpoint' => '',
            'deployment_name' => '',
            'api_version' => '2024-08-01-preview'
        ],
        'configured' => false
    ]);
}

