<?php

namespace local_earlyalert;

class logs
{

    public static function get_logs($date_range = null, $academicyear = null)
    {
        global $CFG, $DB;

        $conditions = [];
        $params = [];
        $applydaterange = true;

        if ($academicyear === 'all') {
            $applydaterange = false;
        }

        if (!empty($academicyear) && $applydaterange) {
            $parsedrange = self::academic_year_to_date_range($academicyear);
            if (!empty($parsedrange)) {
                $date_range = $parsedrange;
            }
        }

        // Set default date range if none provided.
        if ($applydaterange && !$date_range) {
            $current_year = date('Y');
            $current_month = (int)date('n'); // 1-12

            // If current month is September (9) through December (12)
            if ($current_month >= 9) {
                // September 1 current year to August 31 following year
                $start_date = "09/01/{$current_year}";
                $end_date = "08/31/" . ($current_year + 1);
            } else {
                // January through August: September 1 previous year to August 31 current year
                $start_date = "09/01/" . ($current_year - 1);
                $end_date = "08/31/{$current_year}";
            }

            $date_range = "{$start_date} - {$end_date}";
        }

        if ($applydaterange && $date_range) {
            // Expecting date_range in format "MM/DD/YYYY - MM/DD/YYYY"
            list($start_date, $end_date) = explode(' - ', $date_range);
            $start_timestamp = strtotime($start_date . ' 00:00:00');
            $end_timestamp = strtotime($end_date . ' 23:59:59');

            $conditions[] = 'l.timecreated BETWEEN :starttime AND :endtime';
            $params['starttime'] = $start_timestamp;
            $params['endtime'] = $end_timestamp;
        }

        $sql = file_get_contents($CFG->dirroot . '/local/earlyalert/react/dashboard/report_sql.sql');

        $where_clause = '';
        if (!empty($conditions)) {
            $where_clause = 'WHERE ' . implode(' AND ', $conditions);
        }

        $sql .= "\n". $where_clause . "\n
                ORDER BY l.timecreated DESC";

        return $DB->get_records_sql($sql, $params);
    }

    /**
     * Convert an academic year label (YYYY-YYYY) to the default dashboard date range format.
     *
     * @param string $academicyear
     * @return string|null
     */
    private static function academic_year_to_date_range($academicyear)
    {
        if (!preg_match('/^(\d{4})-(\d{4})$/', $academicyear, $matches)) {
            return null;
        }

        $startyear = (int)$matches[1];
        $endyear = (int)$matches[2];

        if ($endyear !== ($startyear + 1)) {
            return null;
        }

        return "09/01/{$startyear} - 08/31/{$endyear}";
    }
}