<?php
// This file is part of Moodle - https://moodle.org/
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
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Library functions for the Early Alert plugin.
 *
 * @package     local_earlyalert
 * @copyright   2024 York University <itinnovation@yorku.ca>
 * @license     https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/**
 * Extends the global navigation with the Early Alert link.
 *
 * This function is called when Moodle builds the navigation tree.
 * It adds a link to the Early Alert tool dashboard in the primary navigation.
 *
 * @param global_navigation $navigation The global navigation object
 */
function local_earlyalert_extend_navigation(global_navigation $navigation) {
    global $PAGE;

    // Only add the link if the user has the capability to access Early Alert or is a site admin.
    if (!is_siteadmin() && !has_capability('local/earlyalert:access_early_alert', context_system::instance())) {
        return;
    }

    // Create the Early Alert navigation node.
    $earlyalertnode = $navigation->add(
        get_string('early_alert', 'local_earlyalert'),
        new moodle_url('/local/earlyalert/tool_dashboard.php'),
        navigation_node::TYPE_CUSTOM,
        null,
        'earlyalert',
        new pix_icon('i/navigationitem', '')
    );

    // Set the node to show in the primary navigation (top menu bar).
    $earlyalertnode->showinflatnavigation = true;
}

/**
 * Add Early Alert link to the primary navigation (navbar).
 *
 * This is the Moodle 5.x method for adding items to the primary navigation bar.
 *
 * @param navigation_node $parentnode The parent navigation node
 * @param stdClass $course The course object
 * @param context $context The current context
 */
function local_earlyalert_extend_navigation_frontpage(navigation_node $parentnode, stdClass $course, context $context) {
    // Only add the link if the user has the capability to access Early Alert or is a site admin.
    if (!is_siteadmin() && !has_capability('local/earlyalert:access_early_alert', context_system::instance())) {
        return;
    }

    // Add Early Alert to the navigation.
    $earlyalertnode = $parentnode->add(
        get_string('early_alert', 'local_earlyalert'),
        new moodle_url('/local/earlyalert/tool_dashboard.php'),
        navigation_node::TYPE_CUSTOM,
        null,
        'earlyalert',
        new pix_icon('i/navigationitem', '')
    );
}
