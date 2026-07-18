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
 * Student lookup form.
 *
 * @package     local_earlyalert
 * @copyright   2024 York University <itinnovation@yorku.ca>
 * @license     https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_earlyalert\form;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/formslib.php');

/**
 * Student lookup form with single-select autocomplete.
 */
class student_lookup extends \moodleform {
    /**
     * Defines the student lookup form.
     *
     * @return void
     */
    public function definition() {
        $mform = $this->_form;

        $selectedoptions = [];
        $selecteduserid = 0;
        if (!empty($this->_customdata['selectedstudent']) && is_object($this->_customdata['selectedstudent'])) {
            $selectedstudent = $this->_customdata['selectedstudent'];
            $selecteduserid = (int)$selectedstudent->id;
            $selectedoptions[$selecteduserid] = trim(
                $selectedstudent->firstname . ' ' . $selectedstudent->lastname
            ) . ' - ' . $selectedstudent->email . ' (' . $selectedstudent->idnumber . ')';
        }

        $mform->addElement(
            'autocomplete',
            'user_id',
            get_string('lookup_student', 'local_earlyalert'),
            $selectedoptions,
            [
                'id' => 'earlyalert-student-search',
                'ajax' => 'local_earlyalert/student_lookup_autocomplete',
                'multiple' => false,
                'placeholder' => get_string('search'),
                'showsuggestions' => true,
            ]
        );
        $mform->setType('user_id', PARAM_INT);

        if ($selecteduserid > 0) {
            $mform->setDefault('user_id', $selecteduserid);
        }
    }
}

