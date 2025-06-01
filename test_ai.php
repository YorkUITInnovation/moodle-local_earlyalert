<?php

require_once('../../config.php');


use local_earlyalert\base;
use local_earlyalert\generative_ai;
use local_earlyalert\table;

global $CFG, $OUTPUT, $PAGE, $DB, $USER;


require_login(1, false);

$context = context_system::instance();

$prompt = optional_param('prompt', '', PARAM_TEXT);

base::page(
    new moodle_url('/local/earlyalert/test_ai.php'),
    'AI Test',
    'AI Test'
);

if ($prompt !== '') {
    $GENAI = new generative_ai(
        $CFG->earlyalert_azureopenai_apikey,
        $CFG->earlyalert_azureopenai_endpoint,
        $CFG->earlyalert_azureopenai_version,
        $CFG->earlyalert_azureopenai_deployment
    );


//    $prompt = 'I need to find all users that have been advised by an advisor. Please also include the course they are in. Also add the user\'s email address and the advisor\'s email address. Do not include the user id.';
    $message = $GENAI->create_message($prompt);
    $results = $GENAI->execute($message);
    $results = json_decode($results, true);


    $TABLE = new table($results['query']);
    $params = array();
}


echo $OUTPUT->header();
//echo $results['query'];
// Add a prompt input field in a Bootstrap 4 row and column
$form = '<div class="row justify-content-center"><div class="col-md-12">';
$form .= '<form method="post" class="form" action="' . new moodle_url('/local/earlyalert/test_files/test_ai.php') . '" class="form-inline mb-3">';
$form .= '<div class="form-group mr-2">';
$form .= '<label for="prompt" class="mr-2">Enter your prompt:</label>';
$form .= '<textarea id="prompt" name="prompt" size="100" class="form-control">' . s($prompt) . '</textarea>';
$form .= '</div>';
$form .= '<button type="submit" class="btn btn-primary">Submit</button>';
$form .= '</form>';
$form .= '</div></div>';
echo $form;


if ($prompt !== '') {
    echo $TABLE->display_table();
    // Remove the TABLE object to free up memory
    UNSET($TABLE);
}

echo $OUTPUT->footer();

