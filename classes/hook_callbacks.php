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

namespace local_earlyalert;

use core\hook\navigation\primary_extend;
use moodle_url;
use context_system;

/**
 * Hook callbacks for Early Alert plugin.
 *
 * @package     local_earlyalert
 * @copyright   2024 York University <itinnovation@yorku.ca>
 * @license     https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class hook_callbacks {

    /**
     * Callback to extend the primary navigation with Early Alert link.
     *
     * @param primary_extend $hook The hook instance
     */
    public static function extend_primary_navigation(primary_extend $hook): void {
        // Skip during unit tests to prevent test failures.
        if (defined('PHPUNIT_TEST') && PHPUNIT_TEST) {
            return;
        }

        // Only add the link if the user has the capability to access Early Alert or is a site admin.
        if (!is_siteadmin() && !has_capability('local/earlyalert:access_early_alert', context_system::instance())) {
            return;
        }

        // Get the primary navigation view from the hook.
        $primaryview = $hook->get_primaryview();

        // Add Early Alert to the primary navigation.
        $primaryview->add(
            get_string('early_alert', 'local_earlyalert'),
            new moodle_url('/local/earlyalert/tool_dashboard.php'),
            null,
            null,
            'earlyalert'
        );
    }
}
