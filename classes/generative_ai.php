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
        $tables = <<<SQL
                course: id bigint(10),category bigint(10),fullname varchar(254),shortname varchar(255),idnumber varchar(100),
                
                course_categories: id bigint(10),name varchar(255),idnumber varchar(100),
                
                local_earlyalert_facspec_txt:id bigint(10),instance_id bigint(10),unit_context bigint(10),facultytext bigint(10),
                
                local_earlyalert_report_log: id bigint(10),template_id bigint(10),revision_id bigint(10),triggered_from_user_id bigint(10),target_user_id bigint(10),
                
                user_read bigint(10),course_id bigint(10),instructor_id bigint(10),assignment_name varchar(255),trigger_grade bigint(10),actual_grade bigint(10),
                
                student_advised_by_advisor bigint(10),student_advised_by_instructor bigint(10),date_message_sent bigint(10),timecreated bigint(10),timemodified bigint(10),
                
                local_et_email: id bigint(10),name varchar(255),subject varchar(255),message longtext,unit varchar(50),context varchar(8),
                active tinyint(1),message_type tinyint(1),deleted tinyint(1),faculty varchar(4),course varchar(10),coursenumber int(8),
                
                local_organization_campus: id bigint(10),name varchar(255),shortname varchar(15),
                
                local_organization_dept: id bigint(10),unit_id bigint(10),name varchar(255),shortname varchar(15),id_number varchar(255),
                
                local_organization_unit: id bigint(10),campus_id bigint(10),name varchar(255),shortname varchar(15),id_number varchar(255),
                
                user: id bigint(10),username varchar(100),idnumber varchar(255),firstname varchar(100),lastname varchar(100),email varchar(100),lang varchar(30),
                lastnamephonetic varchar(255),firstnamephonetic varchar(255),middlename varchar(255),alternatename varchar(255),
                SQL;
        $joins = <<<JOINS
                Joins:
                local_earlyalert_report_log to user: local_earlyalert_report_log.target_user_id = user.id
                local_earlyalert_report_log to course: local_earlyalert_report_log.course_id = course.id
                local_earlyalert_report_log to triggered user: local_earlyalert_report_log.triggered_from_user_id = user.id
                local_earlyalert_report_log to instructor: local_earlyalert_report_log.instructor_id = user.id
                local_earlyalert_report_log to email: local_earlyalert_report_log.template_id = local_et_email.id
                JOINS;

        $other = <<<OTHER
                Always include the local_earlyalert_report_log.id field as the first field in the select statement.
                Always give alaises to table names and use those aliases when adding fields in the select statement.
                The fields local_earlyalert_report_log.student_advised_by_advisor and local_earlyalert_report_log.student_advised_by_instructor are
                boolean fields that indicate whether the student has been advised by the advisor or instructor respectively. The boolean values are either 1 or 0, where 1 means true and 0 means false.
                If the query requires to show the student id, use user.idnumber as student_id.
                If the query requires to show a course, always use the course.shortname as course
                The field local_earlyalert_report_log.date_message_sent is a date field in unix timestamp. Always convert to human a readable format.
                If the WHERE condition requires a course.id, the value following the equal sign must always be a question mark. Example course=?
                Always provide column names in human readable format, for example instead of course.id use course.id as course_id.
                Never finish the select statement with a semicolon.
                OTHER;

        // Concatenate all parts to form the full table definitions.
        $definitions = $tables . "\n\n" . $joins . "\n\n" . $other;
        return $definitions;
    }
}
