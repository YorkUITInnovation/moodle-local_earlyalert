<?php
/**
 * Language strings endpoint for React dashboard
 * Returns translated strings from Moodle's language system
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
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

try {
    // Get the requested string keys (comma-separated or JSON array)
    $keys = optional_param('keys', '', PARAM_TEXT);

    // Support both GET and POST methods
    if (empty($keys) && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        $keys = $data['keys'] ?? '';
    }

    $strings = [];

    if (!empty($keys)) {
        // Parse keys - support both comma-separated and JSON array format
        $keyArray = [];
        if (is_string($keys)) {
            // Try to decode as JSON first
            $decoded = json_decode($keys, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                $keyArray = $decoded;
            } else {
                // Fall back to comma-separated
                $keyArray = array_map('trim', explode(',', $keys));
            }
        } else if (is_array($keys)) {
            $keyArray = $keys;
        }

        // Fetch each string from Moodle's language system
        foreach ($keyArray as $keyItem) {
            // Support two formats:
            // 1. Simple string: "key" (defaults to local_earlyalert)
            // 2. Component:key format: "core:add" or "mod_assignment:assignment"
            // 3. Object format: {"key": "add", "component": "core"}

            $key = '';
            $component = 'local_earlyalert'; // Default component

            if (is_string($keyItem)) {
                $keyItem = clean_param($keyItem, PARAM_TEXT);
                // Check if it's in component:key format
                if (strpos($keyItem, ':') !== false) {
                    list($component, $key) = explode(':', $keyItem, 2);
                    $component = clean_param($component, PARAM_COMPONENT);
                    $key = clean_param($key, PARAM_TEXT);
                } else {
                    $key = $keyItem;
                }
            } else if (is_array($keyItem)) {
                // Object format: {"key": "add", "component": "core"}
                $key = clean_param($keyItem['key'] ?? '', PARAM_TEXT);
                $component = clean_param($keyItem['component'] ?? 'local_earlyalert', PARAM_COMPONENT);
            }

            if (!empty($key)) {
                try {
                    // Create a unique identifier for the string
                    $stringId = ($component !== 'local_earlyalert') ? "{$component}:{$key}" : $key;

                    // Get string from specified component
                    $strings[$stringId] = get_string($key, $component);
                } catch (Exception $e) {
                    // If string doesn't exist, return the key itself
                    $stringId = ($component !== 'local_earlyalert') ? "{$component}:{$key}" : $key;
                    $strings[$stringId] = $key;
                }
            }
        }
    } else {
        // If no keys specified, return all common strings used in the dashboard
        $commonKeys = [
            // Dashboard
            'pluginname',
            'administrative_reports',
            'advisor_reports',

            // Alert types
            'low_grade',
            'missed_assignment',
            'missed_exam',

            // Status
            'send',
            'cancel',
            'preview',

            // Student info
            'student_lookup',
            'name',
            'grade',

            // General
            'early_alert',
            'course_overview',
            'my_courses',
        ];

        foreach ($commonKeys as $key) {
            try {
                $strings[$key] = get_string($key, 'local_earlyalert');
            } catch (Exception $e) {
                $strings[$key] = $key;
            }
        }
    }

    // Return JSON response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'strings' => $strings,
        'count' => count($strings),
        'timestamp' => time()
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

} catch (Exception $e) {
    // Return error response
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
        'strings' => []
    ]);
}

