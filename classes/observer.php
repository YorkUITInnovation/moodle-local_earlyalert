<?php

namespace local_earlyalert;

class observer
{

    public static function earlyalert_viewed_event(\local_earlyalert\event\earlyalert_viewed $event)
    {
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
