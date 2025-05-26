<?php
require_once('../../config.php');
include_once('classes/forms/report.php');

use local_organization\base;

global $CFG, $OUTPUT, $PAGE, $DB, $USER;

require_login(1, false);

$id = optional_param('id', 0, PARAM_INT);

$context = context_system::instance();

if (!has_capability('local/earlyalert:edit_reports', $PAGE->context, $USER->id)) {
    redirect($CFG->wwwroot . '/my');
}

// Load AMD module
//$PAGE->requires->js_call_amd('local_organization/campuses', 'init');
// Load CSS file
//$PAGE->requires->css('/local/organization/css/general.css');

if ($id != 0) {
    $formdata = $DB->get_record('local_earlyalert_reports', array('id' => $id), '*', MUST_EXIST);
} else {
    $formdata = new stdClass();
    $formdata->id = 0;
    $formdata->name = '';
}

$editor_options = array(
    'subdirs' => 1,
    'maxbytes' => $CFG->maxbytes,
    'maxfiles' => -1,
    'changeformat' => 1,
    'context' => $context,
    'noclean' => 1,
    'trusttext' => 0
);
// Add files to form
$draftid = file_get_submitted_draft_itemid('description_editor');
$currentText = file_prepare_draft_area($draftid, $context->id, 'local_earlyalert', 'description_editor', $id, $editor_options, $formdata->description);
$formdata->description_editor = array('text' => $currentText, 'format' => FORMAT_HTML, 'itemid' => $draftid);

$mform = new \local_earlyalert\forms\local_earlyalert_report_form(null, array('formdata' => $formdata));

base::page(
    new moodle_url('/local/earlyalert/generated_reports.php'),
    get_string('generated_reports', 'local_earlyalert'),
    get_string('generated_reports', 'local_earlyalert')
);

echo $OUTPUT->header();

if ($mform->is_cancelled()) {
    // Handle form cancel operation, if cancel button is present
    redirect($CFG->wwwroot . '/local/earlyalert/generated_reports.php');
} else if ($data = $mform->get_data()) {
    $data->description = $data->description_editor['text'];
    if ($data->id > 0) {
        // Update existing report
        $DB->update_record('local_earlyalert_reports', $data);
    } else {
        // Create new report
        $DB->insert_record('local_earlyalert_reports', $data);
    }
    // Get any files for the $data->decscription_editor
    $draftitemid = file_get_submitted_draft_itemid('description_editor');
    file_save_draft_area_files(
        $draftitemid,
        $context->id,
        'local_earlyalert',
        'description_editor',
        $data->id,
        array('subdirs' => true)
    );

} else {
    // Display the form
    $mform->display();
}

echo $OUTPUT->footer();

