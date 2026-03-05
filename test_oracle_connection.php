<?php
/**
 * Oracle SIS Connection Test Script
 *
 * This script tests the Oracle database connection used by the Early Alert system.
 * Run this to diagnose connection issues when sending emails fails.
 *
 * Usage: Access via browser or run from command line:
 * php test_oracle_connection.php
 */

require_once("../../config.php");
require_login();
require_capability('local/earlyalert:access_early_alert', context_system::instance());

// Only allow site admins to run this test
if (!is_siteadmin()) {
    die("This script can only be run by site administrators.");
}

echo "<!DOCTYPE html><html><head><title>Oracle Connection Test</title>";
echo "<style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .success { color: green; font-weight: bold; }
    .error { color: red; font-weight: bold; }
    .info { color: blue; }
    .section { margin: 20px 0; padding: 15px; border: 1px solid #ccc; border-radius: 5px; }
    pre { background: #f5f5f5; padding: 10px; border-radius: 3px; overflow-x: auto; }
</style></head><body>";

echo "<h1>Early Alert - Oracle SIS Connection Test</h1>";
echo "<p>Testing Oracle database connection used for fetching student profile data...</p>";

// Test 1: Check if OCI8 extension is loaded
echo "<div class='section'>";
echo "<h2>Test 1: OCI8 Extension Check</h2>";
if (extension_loaded('oci8')) {
    echo "<p class='success'>✓ OCI8 extension is loaded</p>";
} else {
    echo "<p class='error'>✗ OCI8 extension is NOT loaded. PHP must be compiled with OCI8 support.</p>";
    echo "<p>Install instructions: <code>docker-php-ext-install oci8</code></p>";
    echo "</div></body></html>";
    die();
}
echo "</div>";

// Test 2: Check configuration
echo "<div class='section'>";
echo "<h2>Test 2: Configuration Check</h2>";
global $CFG;

$has_user = isset($CFG->yorktasks_sisuser) && !empty($CFG->yorktasks_sisuser);
$has_pass = isset($CFG->yorktasks_sispass) && !empty($CFG->yorktasks_sispass);
$has_conn = isset($CFG->yorktasks_sisconnstring) && !empty($CFG->yorktasks_sisconnstring);

echo "<table border='1' cellpadding='5'>";
echo "<tr><th>Setting</th><th>Status</th><th>Value</th></tr>";
echo "<tr><td>yorktasks_sisuser</td><td>" . ($has_user ? "<span class='success'>✓ Set</span>" : "<span class='error'>✗ Not Set</span>") . "</td><td>" . ($has_user ? $CFG->yorktasks_sisuser : "N/A") . "</td></tr>";
echo "<tr><td>yorktasks_sispass</td><td>" . ($has_pass ? "<span class='success'>✓ Set</span>" : "<span class='error'>✗ Not Set</span>") . "</td><td>" . ($has_pass ? "********" : "N/A") . "</td></tr>";
echo "<tr><td>yorktasks_sisconnstring</td><td>" . ($has_conn ? "<span class='success'>✓ Set</span>" : "<span class='error'>✗ Not Set</span>") . "</td><td>" . ($has_conn ? htmlspecialchars($CFG->yorktasks_sisconnstring) : "N/A") . "</td></tr>";
echo "</table>";

if (!$has_user || !$has_pass || !$has_conn) {
    echo "<p class='error'>Missing configuration! Add these to your config.php:</p>";
    echo "<pre>";
    echo "\$CFG->yorktasks_sisuser = 'your_oracle_username';\n";
    echo "\$CFG->yorktasks_sispass = 'your_oracle_password';\n";
    echo "\$CFG->yorktasks_sisconnstring = 'your_tns_or_ezconnect_string';\n";
    echo "</pre>";
    echo "</div></body></html>";
    die();
}
echo "</div>";

// Test 3: Test connection
echo "<div class='section'>";
echo "<h2>Test 3: Connection Test</h2>";
try {
    $OCI = new \local_earlyalert\oracle_client();
    $OCI->connect();
    echo "<p class='success'>✓ Successfully connected to Oracle database!</p>";

    // Test 4: Test query
    echo "<div class='section'>";
    echo "<h2>Test 4: Query Test</h2>";
    echo "<p>Testing query against V222.VIEW_MOODLE_EARLY_ALERTS...</p>";

    // Get specific test user with idnumber 221100482
    global $DB;
    $sample_user = $DB->get_record('user', ['idnumber' => '221100482'], 'id, username, idnumber');

    if (!$sample_user) {
        echo "<p class='error'>✗ Test user with idnumber 221100482 not found in Moodle database.</p>";
        echo "<p>Please ensure this user exists or change the test idnumber in the script.</p>";
    } else {
        echo "<p class='info'>Testing with user: " . htmlspecialchars($sample_user->username) . " (ID: " . $sample_user->id . ", IDNumber: " . htmlspecialchars($sample_user->idnumber) . ")</p>";

        try {
            $sql = "SELECT * FROM V222.VIEW_MOODLE_EARLY_ALERTS WHERE SISID=:sisid";
            $params = [':sisid' => trim($sample_user->idnumber)];
            $stid = $OCI->execute_query($sql, $params);

            if (count($stid) > 0) {
                echo "<p class='success'>✓ Query successful! Found " . count($stid) . " record(s)</p>";
                echo "<p>Sample data (first record):</p>";
                echo "<pre>" . htmlspecialchars(print_r($stid[0], true)) . "</pre>";
            } else {
                echo "<p class='info'>Query executed successfully but returned 0 records for this student.</p>";
                echo "<p>This could be normal if this student doesn't have SIS data.</p>";
            }
        } catch (\Exception $e) {
            echo "<p class='error'>✗ Query failed: " . htmlspecialchars($e->getMessage()) . "</p>";
            echo "<p>Check if:</p>";
            echo "<ul>";
            echo "<li>The view 'V222.VIEW_MOODLE_EARLY_ALERTS' exists</li>";
            echo "<li>Your Oracle user has SELECT permission on this view</li>";
            echo "<li>The SISID column exists in the view</li>";
            echo "</ul>";
        }
    }
    echo "</div>";

    $OCI->close();

} catch (\Exception $e) {
    echo "<p class='error'>✗ Connection failed: " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<p>Common issues:</p>";
    echo "<ul>";
    echo "<li>Invalid credentials</li>";
    echo "<li>Network connectivity to Oracle server</li>";
    echo "<li>Firewall blocking connection</li>";
    echo "<li>Invalid TNS/connection string</li>";
    echo "<li>Oracle listener not running</li>";
    echo "</ul>";
}
echo "</div>";

echo "<div class='section'>";
echo "<h2>Summary</h2>";
echo "<p>If all tests passed, the Oracle connection is working correctly.</p>";
echo "<p>If you're still experiencing email sending issues, check the Moodle error logs for specific error messages.</p>";
echo "<p><strong>Log location:</strong> Check your Docker container logs or <code>moodledata/error_log</code></p>";
echo "</div>";

echo "</body></html>";
