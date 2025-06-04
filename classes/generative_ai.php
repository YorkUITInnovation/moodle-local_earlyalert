<?php

namespace local_earlyalert;

class generative_ai
{
    private $apiKey;
    private $endpoint;
    private $apiVersion;
    private $deploymentName;

    public function __construct($apiKey, $endpoint, $apiVersion, $deploymentName)
    {
        $this->apiKey = $apiKey;
        $this->endpoint = rtrim($endpoint, '/');
        $this->apiVersion = $apiVersion;
        $this->deploymentName = $deploymentName;
    }

    /**
     * Creates a message array for Azure OpenAI chat API with a fixed system message.
     * @param string $prompt The user's message or prompt.
     * @return array The formatted message array.
     */
    public function create_message($prompt)
    {
        $system_message = 'You are a MySQL query writer. You can only write select statements, and there is no other type of SQL query that you can write.'
            . ' If you are asked to write anything but a select query, you must tell the user the following: "Sorry, I cannot write anything but select queries."'
            . 'The following are the table definitions you must always use when writing the query: ' . "\n\n"
            . $this->get_table_definitions() . "\n\n"
            . 'Table names in the sql query must always be between currly brackets {}. For example {user} or {course}.';
        return [
            [
                'role' => 'system',
                'content' => $system_message
            ],
            [
                'role' => 'user',
                'content' => $prompt . "\n\nOnly return the SQL statement in this json format {\"query\": \"the sql statement\"}"
            ]
        ];
    }

    /**
     * Runs a chat query against Azure OpenAI and returns the result.
     * @param array $messages Array of message objects as per OpenAI API (role, content)
     * @return mixed Response from Azure OpenAI
     */
    public function execute(array $messages)
    {
        $url = $this->endpoint . "/openai/deployments/$this->deploymentName/chat/completions?api-version=$this->apiVersion";
        $headers = [
            "Content-Type: application/json",
            "api-key: $this->apiKey"
        ];

        $data = [
            "messages" => $messages,
            "max_tokens" => 4096,
            "temperature" => 0.7
        ];

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $result = curl_exec($ch);
        curl_close($ch);

        $response = json_decode($result, true);
        $content = $response['choices'][0]['message']['content'] ?? '';
        return $content;
    }

    /**
     * Returns the text definitions of the plugin's tables as found in install.xml.
     * @return string
     */
    public function get_table_definitions()
    {
        global $CFG;

        // If the configuration variables are not set, return an error notification.
        if (empty($CFG->earlyalert_reports_tables)) {
            return 'No table definitions found in the configuration. An SQL statement cannot be created.';
        }

        $tables = "Tables:\n\n" . $CFG->earlyalert_reports_tables;
        if (!empty($CFG->earlyalert_reports_joins)) {
            $joins = "Joins:\n\n" . $CFG->earlyalert_reports_joins;
        }
        if (!empty($CFG->earlyalert_reports_other)) {
            $other = "Other:\n\n" . $CFG->earlyalert_reports_other;
        }
        // Concatenate all parts to form the full table definitions.
        $definitions = $tables . "\n\n" . $joins . "\n\n" . $other;

        return trim($definitions);
    }
}
