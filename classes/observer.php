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
 * Event observers for the Early Alert plugin.
 *
 * @package     local_earlyalert
 * @copyright   2024 York University <itinnovation@yorku.ca>
 * @license     https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_earlyalert;

defined('MOODLE_INTERNAL') || die();

/**
 * Event observer class.
 */
class observer {

    /**
     * Handle the early alert viewed event.
     *
     * @param \local_earlyalert\event\earlyalert_viewed $event
     * @return bool
     */
    public static function earlyalert_viewed_event(\local_earlyalert\event\earlyalert_viewed $event) {
        global $DB, $CFG, $USER;
        ob_start();
        var_export($event);
        $contents = ob_get_contents();
        ob_end_clean();
        error_log($contents);
        error_log("Early Alert Tool Dashboard viewed Event Fired : ");

        return true;

    }
}
