<?php
namespace local_earlyalert\event;

defined('MOODLE_INTERNAL') || die();

class earlyalert_viewed extends \core\event\base {
    protected function init() {
        $this->data['crud'] = 'r'; // Create
        $this->data['edulevel'] = self::LEVEL_PARTICIPATING;
    }

    public static function get_name() {
        return get_string('earlyalert_viewed', 'local_earlyalert');
    }

    public function get_description() {
        return "The user with id '{$this->userid}' viewed the Early Alert Dashboard.";
    }
}