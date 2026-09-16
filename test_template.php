<?php
require_once('../../config.php');
require_admin();

global $DB;

use local_earlyalert\helper;
use local_etemplate\email;

/**
 * Reads a user profile field value by shortname.
 *
 * @param int $userid
 * @param string $shortname
 * @return string
 */
function local_earlyalert_debug_get_profile_field(int $userid, string $shortname): string {
    global $DB;

    $sql = "SELECT COALESCE(NULLIF(uid.data, ''), NULLIF(uif.defaultdata, ''), '')
              FROM {user_info_field} uif
         LEFT JOIN {user_info_data} uid ON uid.fieldid = uif.id AND uid.userid = :userid
             WHERE uif.shortname = :shortname";

    return (string)($DB->get_field_sql($sql, ['userid' => $userid, 'shortname' => $shortname]) ?: '');
}

/**
 * Matches course_grades_ws language normalization.
 *
 * @param string $lang
 * @return string
 */
function local_earlyalert_debug_process_lang_for_templates(string $lang): string {
    $lang = strtolower(trim($lang));
    $alloweden = ['en', 'en-ca', 'en-us'];
    $allowedfr = ['fr', 'fr-ca', 'fr-fr'];

    if (in_array($lang, $alloweden, true)) {
        return 'en';
    }
    if (in_array($lang, $allowedfr, true)) {
        return 'fr';
    }

    return 'en';
}

/**
 * Maps UI alert type to message type constants.
 *
 * @param string $alerttype
 * @return int
 */
function local_earlyalert_debug_map_alert_type_to_message_type(string $alerttype): int {
    switch ($alerttype) {
        case 'assign':
            return email::MESSAGE_TYPE_ASSIGNMENT;
        case 'exam':
            return email::MESSAGE_TYPE_EXAM;
        case 'commendation':
            return email::MESSAGE_TYPE_COMMENDATION;
        case 'catchall':
            return email::MESSAGE_TYPE_CATCHALL;
        case 'grade':
        default:
            return email::MESSAGE_TYPE_GRADE;
    }
}

/**
 * Extracts course and coursenumber from idnumber in the same format as WS.
 *
 * @param string $idnumber
 * @return array
 */
function local_earlyalert_debug_parse_course_idnumber(string $idnumber): array {
    $parts = array_pad(explode('_', (string)$idnumber), 5, '');
    return [
        'course' => trim((string)$parts[2]),
        'coursenumber' => trim((string)$parts[4]),
    ];
}

/**
 * Collects matching counts for each template priority branch.
 *
 * @param string $campus
 * @param string $faculty
 * @param string $department
 * @param string $course_name
 * @param string $course_number
 * @param int $message_type
 * @param string $lang
 * @return array
 */
function local_earlyalert_debug_collect_template_diagnostics(
    string $campus,
    string $faculty,
    string $department,
    string $course_name,
    string $course_number,
    int $message_type,
    string $lang
): array {
    global $DB;

    $details = [];
    $details[] = [
        'label' => 'Any active, non-deleted templates',
        'count' => (int)$DB->count_records('local_et_email', ['active' => 1, 'deleted' => 0]),
        'samples' => [],
    ];
    $details[] = [
        'label' => 'Active + non-deleted + message_type + lang',
        'count' => (int)$DB->count_records('local_et_email', [
            'active' => 1,
            'deleted' => 0,
            'message_type' => $message_type,
            'lang' => $lang,
        ]),
        'samples' => [],
    ];

    if ($campus === '') {
        return $details;
    }

    $campusnormalized = strtolower((string)preg_replace('/[\s()\-_]+/', '', $campus));
    $campusnormalizedexpr = "REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(LOWER(campus), ' ', ''), '(', ''), ')', ''), '-', ''), '_', '')";
    $campusmatchsql = "(campus = :campus OR {$campusnormalizedexpr} = :campusnormalized)";
    $facultywildcardsql = "(faculty IS NULL OR TRIM(faculty) = '' OR LOWER(TRIM(faculty)) IN ('catch all', 'catch-all', 'catchall', 'catch all:', 'catch-all:', '*'))";

    $checks = [
        ['label' => 'Priority 1: campus + faculty + department + course + coursenumber + message_type + lang', 'where' => "{$campusmatchsql} AND faculty = :faculty AND department = :department AND course = :course AND coursenumber = :coursenumber AND message_type = :messagetype AND lang = :lang"],
        ['label' => 'Priority 2: campus + faculty + (no department) + course + coursenumber + message_type + lang', 'where' => "{$campusmatchsql} AND faculty = :faculty AND (department IS NULL OR department = '') AND course = :course AND coursenumber = :coursenumber AND message_type = :messagetype AND lang = :lang"],
        ['label' => 'Priority 3: campus + catch-all faculty + (no department) + course + coursenumber + message_type + lang', 'where' => "{$campusmatchsql} AND {$facultywildcardsql} AND (department IS NULL OR department = '') AND course = :course AND coursenumber = :coursenumber AND message_type = :messagetype AND lang = :lang"],
        ['label' => 'Priority 4: campus + faculty + department + message_type + lang', 'where' => "{$campusmatchsql} AND faculty = :faculty AND department = :department AND message_type = :messagetype AND lang = :lang"],
        ['label' => 'Priority 5: campus + faculty + (no department) + message_type + lang', 'where' => "{$campusmatchsql} AND faculty = :faculty AND (department IS NULL OR department = '') AND message_type = :messagetype AND lang = :lang"],
        ['label' => 'Priority 6: campus + faculty + message_type + lang', 'where' => "{$campusmatchsql} AND faculty = :faculty AND message_type = :messagetype AND lang = :lang"],
        ['label' => 'Priority 7: campus + catch-all faculty + (no department) + message_type + lang', 'where' => "{$campusmatchsql} AND {$facultywildcardsql} AND (department IS NULL OR department = '') AND message_type = :messagetype AND lang = :lang"],
        ['label' => 'Priority 8: campus + message_type + lang', 'where' => "{$campusmatchsql} AND message_type = :messagetype AND lang = :lang"],
        ['label' => 'Priority 9: faculty + message_type + lang', 'where' => "faculty = :faculty AND message_type = :messagetype AND lang = :lang"],
    ];

    $baseparams = [
        'campus' => $campus,
        'campusnormalized' => $campusnormalized,
        'faculty' => $faculty,
        'department' => $department,
        'course' => $course_name,
        'coursenumber' => $course_number,
        'messagetype' => $message_type,
        'lang' => $lang,
    ];

    foreach ($checks as $check) {
        $countsql = "SELECT COUNT(1)
                       FROM {local_et_email}
                      WHERE active = 1
                        AND deleted = 0
                        AND {$check['where']}";
        $samplesql = "SELECT id, name, campus, faculty, department, course, coursenumber, message_type, lang
                        FROM {local_et_email}
                       WHERE active = 1
                         AND deleted = 0
                         AND {$check['where']}
                    ORDER BY id ASC";

        $samples = $DB->get_records_sql($samplesql, $baseparams, 0, 3);
        $details[] = [
            'label' => $check['label'],
            'count' => (int)$DB->count_records_sql($countsql, $baseparams),
            'samples' => array_values($samples),
        ];
    }

    return $details;
}

/**
 * Infers likely root cause when no template matches.
 *
 * @param array $diagnostics
 * @param string $campus
 * @param string $course_name
 * @param string $course_number
 * @param int $message_type
 * @param string $lang
 * @return string
 */
function local_earlyalert_debug_infer_root_cause(
    array $diagnostics,
    string $campus,
    string $course_name,
    string $course_number,
    int $message_type,
    string $lang
): string {
    $counts = [];
    foreach ($diagnostics as $idx => $row) {
        $counts[$idx] = (int)($row['count'] ?? 0);
    }

    if ($campus === '') {
        return 'Campus is empty for this student/input. get_email_template() returns null immediately when campus is blank.';
    }
    if (($counts[0] ?? 0) === 0) {
        return 'No active, non-deleted templates exist in local_et_email.';
    }
    if (($counts[1] ?? 0) === 0) {
        return 'No active templates match message_type=' . $message_type . ' and lang=' . $lang . '.';
    }

    $prioritysum = 0;
    for ($i = 2; $i <= 10; $i++) {
        $prioritysum += $counts[$i] ?? 0;
    }
    if ($prioritysum === 0) {
        return 'Templates exist for this message type/lang, but none match campus/faculty/department/course filters.';
    }

    $coursespecificsum = ($counts[2] ?? 0) + ($counts[3] ?? 0) + ($counts[4] ?? 0);
    $generalfallbacksum = ($counts[5] ?? 0) + ($counts[6] ?? 0) + ($counts[7] ?? 0) + ($counts[8] ?? 0) + ($counts[9] ?? 0) + ($counts[10] ?? 0);

    if ($coursespecificsum === 0 && $generalfallbacksum > 0 && ($course_name === '' || $course_number === '')) {
        return 'General templates may match, but course-specific fields are empty from course idnumber parsing.';
    }
    if ($coursespecificsum === 0 && $generalfallbacksum > 0) {
        return 'General templates exist, but no course-specific template matches course/coursenumber.';
    }

    return 'No single dominant cause detected; review per-priority counts and sample rows.';
}

/**
 * Finds nearest template candidates and explains field-level mismatches.
 *
 * @param string $campus
 * @param string $faculty
 * @param string $department
 * @param string $course_name
 * @param string $course_number
 * @param int $message_type
 * @param string $lang
 * @return array
 */
function local_earlyalert_debug_find_nearest_templates(
    string $campus,
    string $faculty,
    string $department,
    string $course_name,
    string $course_number,
    int $message_type,
    string $lang
): array {
    global $DB;

    $templates = $DB->get_records('local_et_email', ['active' => 1, 'deleted' => 0], 'id ASC');
    $results = [];
    $campusnormalized = strtolower((string)preg_replace('/[\s()\-_]+/', '', $campus));

    foreach ($templates as $t) {
        $score = 0;
        $mismatches = [];

        $templatecampus = (string)($t->campus ?? '');
        $templatecampusnormalized = strtolower((string)preg_replace('/[\s()\-_]+/', '', $templatecampus));
        if ($campus !== '' && ($templatecampus === $campus || $templatecampusnormalized === $campusnormalized)) {
            $score += 3;
        } else {
            $mismatches[] = 'campus';
        }

        if ((string)($t->faculty ?? '') === $faculty) {
            $score += 2;
        } else {
            $mismatches[] = 'faculty';
        }

        if ((string)($t->department ?? '') === $department) {
            $score += 2;
        } else {
            $mismatches[] = 'department';
        }

        if ((string)($t->course ?? '') === $course_name) {
            $score += 2;
        } else {
            $mismatches[] = 'course';
        }

        if ((string)($t->coursenumber ?? '') === $course_number) {
            $score += 2;
        } else {
            $mismatches[] = 'coursenumber';
        }

        if ((int)($t->message_type ?? -1) === $message_type) {
            $score += 3;
        } else {
            $mismatches[] = 'message_type';
        }

        if ((string)($t->lang ?? '') === $lang) {
            $score += 3;
        } else {
            $mismatches[] = 'lang';
        }

        $results[] = [
            'score' => $score,
            'mismatches' => $mismatches,
            'template' => $t,
        ];
    }

    usort($results, function ($a, $b) {
        if ($a['score'] === $b['score']) {
            return (int)$a['template']->id <=> (int)$b['template']->id;
        }
        return $b['score'] <=> $a['score'];
    });

    return array_slice($results, 0, 5);
}

// Get parameters from URL
$studentid = optional_param('studentid', 0, PARAM_INT);
$courseid = optional_param('courseid', 0, PARAM_INT);
$alerttype = optional_param('alert_type', 'grade', PARAM_ALPHAEXT);

$campus = trim((string)optional_param('campus', '', PARAM_TEXT));
$faculty = trim((string)optional_param('faculty', '', PARAM_TEXT));
$department = strtoupper(trim((string)optional_param('department', '', PARAM_TEXT)));
$course_name = strtoupper(trim((string)optional_param('course', '', PARAM_TEXT)));
$course_number = strtoupper(trim((string)optional_param('coursenumber', '', PARAM_TEXT)));
$message_type = optional_param('message_type', email::MESSAGE_TYPE_GRADE, PARAM_INT);
$lang = strtolower(trim((string)optional_param('lang', 'en', PARAM_TEXT)));
$grade_letter_id = optional_param('grade_letter_id', 0, PARAM_INT);

$usingstudentcourselookup = ($studentid > 0 && $courseid > 0);
$contextnotes = [];

if ($usingstudentcourselookup) {
    $student = $DB->get_record('user', ['id' => $studentid], 'id,firstname,lastname,idnumber,lang');
    $course = $DB->get_record('course', ['id' => $courseid], 'id,fullname,idnumber');

    if (!$student) {
        throw new \moodle_exception('invaliduser');
    }
    if (!$course) {
        throw new \moodle_exception('invalidcourseid');
    }

    $campus = trim(local_earlyalert_debug_get_profile_field((int)$student->id, 'campus'));
    $faculty = trim(local_earlyalert_debug_get_profile_field((int)$student->id, 'ldapfaculty'));
    $department = trim(local_earlyalert_debug_get_profile_field((int)$student->id, 'ldapmajor'));

    $courseparts = local_earlyalert_debug_parse_course_idnumber((string)($course->idnumber ?? ''));
    $course_name = $courseparts['course'];
    $course_number = $courseparts['coursenumber'];
    $message_type = local_earlyalert_debug_map_alert_type_to_message_type((string)$alerttype);
    $lang = local_earlyalert_debug_process_lang_for_templates((string)($student->lang ?? 'en'));

    if ($campus === '') {
        $contextnotes[] = 'Student campus profile value is empty; helper::get_email_template() will return null immediately.';
    }
    if (empty((string)($course->idnumber ?? ''))) {
        $contextnotes[] = 'Course idnumber is empty; course-specific template matching (course/coursenumber) may not match.';
    }
}

echo "<h1>Template Test Page</h1>";
echo "<h2>Mode:</h2>";
echo $usingstudentcourselookup
    ? "<p><strong>Student/Course lookup mode</strong> (mirrors alert template selection path)</p>"
    : "<p><strong>Manual parameter mode</strong></p>";

if ($usingstudentcourselookup) {
    echo "<h2>Lookup Inputs:</h2>";
    echo "<ul>";
    echo "<li>Student ID: " . (int)$studentid . "</li>";
    echo "<li>Course ID: " . (int)$courseid . "</li>";
    echo "<li>Alert Type: " . htmlspecialchars((string)$alerttype) . "</li>";
    echo "</ul>";
}

echo "<h2>Input Parameters:</h2>";
echo "<ul>";
echo "<li>Campus: " . htmlspecialchars($campus) . "</li>";
echo "<li>Faculty: " . htmlspecialchars($faculty) . "</li>";
echo "<li>Department: " . htmlspecialchars($department) . "</li>";
echo "<li>Course: " . htmlspecialchars($course_name) . "</li>";
echo "<li>Course Number: " . htmlspecialchars($course_number) . "</li>";
echo "<li>Message Type: " . htmlspecialchars($message_type) . "</li>";
echo "<li>Lang: " . htmlspecialchars($lang) . "</li>";
echo "</ul>";

if ($usingstudentcourselookup) {
    echo "<h2>Resolved Source Data:</h2>";
    echo "<ul>";
    echo "<li>Student idnumber: " . htmlspecialchars((string)($student->idnumber ?? '')) . "</li>";
    echo "<li>Student lang raw: " . htmlspecialchars((string)($student->lang ?? '')) . "</li>";
    echo "<li>Course idnumber raw: " . htmlspecialchars((string)($course->idnumber ?? '')) . "</li>";
    echo "</ul>";

    if (!empty($contextnotes)) {
        echo "<h3>Notes:</h3><ul>";
        foreach ($contextnotes as $note) {
            echo "<li>" . htmlspecialchars($note) . "</li>";
        }
        echo "</ul>";
    }
}

$template = helper::get_email_template(
    (string)$campus,
    (string)$faculty,
    (string)$department,
    (string)$course_name,
    (string)$course_number,
    (int)$message_type,
    (string)$lang
);

echo "<h2>Selected Template:</h2>";

if ($template) {
    echo "<p><strong>Priority Selected:</strong> " . $template->priority . "</p>";
    echo "<pre>";
    print_r($template);
    echo "</pre>";
} else {
    echo "<p>No template found for the given parameters.</p>";

    $diagnostics = local_earlyalert_debug_collect_template_diagnostics(
        (string)$campus,
        (string)$faculty,
        (string)$department,
        (string)$course_name,
        (string)$course_number,
        (int)$message_type,
        (string)$lang
    );

    echo "<h2>Why No Template Matched</h2>";
    echo "<p>These counts use the same fields/rules as <code>helper::get_email_template()</code>. Any count &gt; 0 indicates matching rows at that stage.</p>";
    $verdict = local_earlyalert_debug_infer_root_cause(
        $diagnostics,
        (string)$campus,
        (string)$course_name,
        (string)$course_number,
        (int)$message_type,
        (string)$lang
    );
    echo "<p><strong>Likely root cause:</strong> " . htmlspecialchars($verdict) . "</p>";
    echo "<ol>";
    foreach ($diagnostics as $row) {
        echo "<li><strong>" . htmlspecialchars((string)$row['label']) . ":</strong> " . (int)$row['count'] . "</li>";
        if (!empty($row['samples'])) {
            echo "<pre>";
            foreach ($row['samples'] as $sample) {
                echo 'id=' . (int)$sample->id
                    . ' name=' . (string)$sample->name
                    . ' campus=' . (string)$sample->campus
                    . ' faculty=' . (string)$sample->faculty
                    . ' department=' . (string)$sample->department
                    . ' course=' . (string)$sample->course
                    . ' coursenumber=' . (string)$sample->coursenumber
                    . ' message_type=' . (string)$sample->message_type
                    . ' lang=' . (string)$sample->lang
                    . "\n";
            }
            echo "</pre>";
        }
    }
    echo "</ol>";

    $nearest = local_earlyalert_debug_find_nearest_templates(
        (string)$campus,
        (string)$faculty,
        (string)$department,
        (string)$course_name,
        (string)$course_number,
        (int)$message_type,
        (string)$lang
    );

    echo "<h2>Closest Template Candidates</h2>";
    echo "<p>Top active templates by field-match score against this student/course lookup.</p>";
    if (empty($nearest)) {
        echo "<p>No active templates exist to compare.</p>";
    } else {
        echo "<pre>";
        foreach ($nearest as $candidate) {
            $t = $candidate['template'];
            echo 'id=' . (int)$t->id
                . ' score=' . (int)$candidate['score']
                . ' mismatches=' . (empty($candidate['mismatches']) ? 'none' : implode(',', $candidate['mismatches']))
                . ' name=' . (string)$t->name
                . ' campus=' . (string)$t->campus
                . ' faculty=' . (string)$t->faculty
                . ' department=' . (string)$t->department
                . ' course=' . (string)$t->course
                . ' coursenumber=' . (string)$t->coursenumber
                . ' message_type=' . (string)$t->message_type
                . ' lang=' . (string)$t->lang
                . "\n";
        }
        echo "</pre>";
    }
}

echo "<h2>All Grade Ranges:</h2>";
echo "<pre>";
$grade_ranges = helper::get_moodle_grade_percent_range($grade_letter_id);
print_r($grade_ranges);
echo "</pre>";
