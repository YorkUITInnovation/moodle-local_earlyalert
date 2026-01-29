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
 * Early alert viewed event.
 *
 * @package     local_earlyalert
 * @copyright   2024 York University <itinnovation@yorku.ca>
 * @license     https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_earlyalert\event;

defined('MOODLE_INTERNAL') || die();

/**
 * Early alert viewed event class.
 */
class earlyalert_viewed extends \core\event\base {
    /**
     * Initialize the event.
     */
    protected function init() {
        $this->data['crud'] = 'r'; // Read.
        $this->data['edulevel'] = self::LEVEL_PARTICIPATING;
    }

    /**
     * Get the name of the event.
     *
     * @return string
     */
    public static function get_name() {
        return get_string('earlyalert_viewed', 'local_earlyalert');
    }

    /**
     * Get the description of the event.
     *
     * @return string
     */
    public function get_description() {
        return "The user with id '{$this->userid}' viewed the Early Alert Dashboard.";
    }
}