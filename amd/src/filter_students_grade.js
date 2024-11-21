import ajax from 'core/ajax';
import Templates from 'core/templates';
import ModalFactory from 'core/modal_factory';
import {get_string as getString} from 'core/str';
import notification from 'core/notification';

export const init = () => {
    alert_type_button();
    // get_users();
    // get_templates();
};

function alert_type_button() {
    // Get data-link when .early-alert-type-button link is clicked
    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('early-alert-type-button')) {
            let alert_type = event.target.getAttribute('data-link');
            let course_name = event.target.getAttribute('data-name');
            let course_id = event.target.getAttribute('data-course_id');
            // Get student list based on alert type
            setup_filter_students_by_grade(course_id, 9, course_name, alert_type);
        }
    });
}


/**
 * Adds students with grades
 */
// function filter_students_by_default_grade() {
//
//     // Get course id from the hidden input field wiht id early_alert_filter_course_id
//     const course_id = document.getElementById('early_alert_filter_course_id').value;
//     // initial default setup of student list
//     setup_filter_students_by_grade(course_id, 9); // extract this 9 from php which might be configurable in the future
//
// }

function filter_students_by_grade_select() {

    // Get the s delected grade value from the dropdown
    const grade_select = document.getElementById('id_early_alert_filter_grade_select');
    const course_id = document.getElementById('early_alert_filter_course_id').value;
    const course_name = document.getElementById('early_alert_course_name').value;
    const alert_type = document.getElementById('early-alert-alert-type').value;
    // setup listener for drop down selection

    grade_select.addEventListener('change', function (e) {
        let grade_letter_id = e.target.value;
        setup_filter_students_by_grade(course_id, grade_letter_id, course_name, alert_type);

    });
}

/**
 * Fetches the student list based on the course_id and grade_letter_id
 * @param course_id
 * @param grade_letter_id
 * @param course_name
 * @param alert_type
 */
function setup_filter_students_by_grade(course_id, grade_letter_id, course_name, alert_type) {
    let selected_students = [];
    // convert course_id into an integer
    course_id = parseInt(course_id);
    grade_letter_id = parseInt(grade_letter_id);
    // Add course_id to element with id early_alert_filter_course_id
    document.getElementById('early_alert_filter_course_id').value = course_id;
    // Add alert type to element with id early-alert-alert-type
    document.getElementById('early-alert-alert-type').value = alert_type;
    // Add course name to element with id early_alert_course_name
    document.getElementById('early_alert_course_name').value = course_name;

    // Only display if course_id is greater than 0
    if (course_id > 0) {
        //Show loader
        Templates.render('local_earlyalert/loader', {})
            .then(function (html, js) {
                // Insert the rendered template into the target element
                document.getElementById('early-alert-student-results').innerHTML = html;
                Templates.runTemplateJS(js);
            })
            .catch(function (error) {
                console.error('Failed to render template:', error);
            });



        // Fetch student list and templates
        var get_grades_and_templates = ajax.call([
            { methodname: 'earlyalert_course_grades_percent_get', args: { id: course_id, grade_letter_id: grade_letter_id } },
            { methodname: 'earlyalert_course_student_templates', args: { id: course_id } }
        ]);

        const finalCache = new Map();

        Promise.all(get_grades_and_templates).then(([grades_response, templates_response]) => {
            
            // Reformat the data to display in a grid
            let num_students = grades_response.length;
            console.log('Number of students returned: ' + num_students);
            let num_rows = Math.min(3, Math.ceil(num_students / 3));
            let num_cols = Math.ceil(num_students / num_rows);
            let display_data = {
                num_rows: num_rows,
                num_cols: num_cols,
                student_rows: []
            };

            let templates = [];

// Initialize rows array
            for (let r = 0; r < num_rows; r++) {
                display_data.student_rows[r] = {students: []};
            }

            let row = 0;
            let col = 0;

            grades_response.forEach(result => {
                if (typeof result === 'object') {
                    if (!templates.includes(result.campus + "_" + result.faculty + "_" + result.major)) {
                        templates.push(result.campus + "_" + result.faculty + "_" + result.major);
                    }
                    display_data.student_rows[row].students[col] = result;
                    col++;
                    if (col === num_cols) {
                        col = 0;
                        row++;
                    }
                }
            });

            display_data.templates = JSON.stringify(templates);

            if (alert_type === 'grade') {
                // Add alert_type to display_data
                display_data.alert_type = 'Low Grade';
                display_data.grade = true;
            }

            if (alert_type === 'assign') {
                // Add alert_type to display_data
                display_data.alert_type = 'Missed Assignment';
                display_data.assign = true;
            }

            if (alert_type === 'exam') {
                // Add alert_type to display_data
                display_data.alert_type = 'Missed Exam';
                display_data.exam = true;
            }
            display_data.fullname = course_name;

            // Render the template with display_data
            Templates.render('local_earlyalert/course_student_list', display_data)
                .then(function (html, js) {
                    // Insert the rendered template into the target element
                    document.getElementById('early-alert-student-results').innerHTML = html;
                    Templates.runTemplateJS(js);
                    // set default grade letter selected
                    let grade_select = document.getElementById('id_early_alert_filter_grade_select');
                    grade_select.value = grade_letter_id;
                    // setup listener
                    // filter_students_by_grade_select();
                    check_all_student_grades(selected_students);
                    check_allnone_listener(selected_students);

                    const cachedArrayElement = document.getElementById('early-alert-template-cache');
                    const cachedArray = JSON.parse(cachedArrayElement.value);

                    templates_response.forEach(result => {
                        if (typeof result === 'object') {
                            if (cachedArray.includes(result.templateKey)){
                                // finalCache.push({key: result.templateKey, value: result.message});
                                finalCache.set(result.templateKey, result.message);
                            }
                        }
                    });
                    finalCache.set('course_name', course_name);
                    setup_preview_emails(finalCache);
                    setup_send_emails();
                })
                .catch(function (error) {
                    console.error('Failed to render template:', error);
                });
        });

    }
}


function check_all_student_grades(selected_students) {
    const student_ids_selected = document.getElementById("early-alert-student-ids") || {};
    student_ids_selected.value = [];
    const check_all_none_checkbox = document.getElementById('early-alert-checkall-student-checkbox');
    check_all_none_checkbox.checked = true;
    //check box for grade showing - remove later
    const student_checkboxes = document.querySelectorAll("input[class^='early-alert-student-checkbox']");
    // check box for grade showing - remove later
    student_checkboxes.forEach(function (checkbox) {
        checkbox.checked = true;
        selected_students.push(checkbox.getAttribute('data-student-id'));
    });
    student_ids_selected.value = JSON.stringify(selected_students);
}

function check_allnone_listener(selected_students) {
    // Add an event listener to the select all checkbox
    const check_all_none_checkbox = document.getElementById('early-alert-checkall-student-checkbox');
    const student_ids_selected = document.getElementById("early-alert-student-ids") || {};

    check_all_none_checkbox.addEventListener('click', function () {
        student_ids_selected.value = [];
        // Get all checkboxes within the list
        let checkboxes = document.querySelectorAll("input[class^='early-alert-student-checkbox']");
        // Loop through each checkbox and toggle its selection based on the state of the select all checkbox
        checkboxes.forEach(function (checkbox) {
            if (check_all_none_checkbox.checked) {
                checkbox.checked = true;
                selected_students.push(checkbox.getAttribute('data-student-id'));
            } else {
                checkbox.checked = false;
                selected_students = selected_students.filter(item => item !== checkbox.getAttribute('data-student-id'));
            }
        });
        student_ids_selected.value = JSON.stringify(selected_students);
    });
}

function setup_preview_emails(templateCache) {
    const preview_buttons = document.querySelectorAll(".early-alert-preview-button");
    // Loop through each checkbox and toggle its selection based on the state of the select all checkbox
    console.log("template cache:", templateCache);
    let record_data = {};
    preview_buttons.forEach(function (button) {
        const checkbox = button.closest('tr').querySelector('.early-alert-student-checkbox');
        const assigngrade = button.closest('tr').querySelector('.early-alert-grade-column').querySelector('.badge').innerHTML;
        if (checkbox) {

            // now, access the parent <tr> element (the table row)
            const table_row = checkbox.parentNode;
            // extract the student name from the second <td> element within the table row
            const student_name_td = table_row.nextElementSibling;
            // fix and parse the name
            const student_lname_fname = student_name_td.firstChild;
            var student_name_arr = [];
            var student_name = "";
            student_lname_fname.data.split(/\s*,\s*/).forEach(function(me) {
                student_name_arr.push(me);
            });
            student_name = student_name_arr[1] + ' ' + student_name_arr[0];

            const student_id = checkbox.getAttribute('data-student-id');
            const studentCampusAttr = checkbox.getAttribute('data-student-campus');
            const studentFacultyAttr = checkbox.getAttribute('data-student-faculty');
            const studentMajorAttr = checkbox.getAttribute('data-student-major');
            var templateKey = studentCampusAttr  + '_'  + studentFacultyAttr  + '_'  + studentMajorAttr;
            var templateEmailContent = '';

            console.log("Looking for '" + templateKey + "'");
            console.log("map get:'", templateCache.get(templateKey),"'");
            templateCache.forEach(function(value, key) {
                console.log("key:", key);
                console.log("value:", value);
            });
            if (templateCache.includes(templateKey)) {
                templateEmailContent = templateCache[templateKey].message;
            } else {
                templateEmailContent = 'Template not found';
            }

        } else {
            // console.log("couldn't find checkbox :/");
        }
        if (assigngrade){
            console.log("assign grade: ", assigngrade);
        }
        console.log("template email content:", templateEmailContent);

        // assemble record data for individual buttons which includes student and template data
        record_data.student_name = student_name;
        record_data.course_name = templateCache.get('course_name');
        record_data.templateEmailContent = templateEmailContent;

        button.addEventListener('click', function () {
            setup_preview_buttons_from_template(record_data)
        });
    });
}

function setup_preview_buttons_from_template(student_template_data) {

    ModalFactory.create({
        title: getString('preview_email', 'local_earlyalert'),
        type: ModalFactory.types.CANCEL,
        body: Templates.render('local_earlyalert/preview_student_email', {
            name: student_template_data.template_name,
            student_name: student_template_data.student_name,
            subject: 'Grade in ' + student_template_data.course_name,
            message: student_template_data.templateEmailContent,
            instructor_name: ''
        }),
        large: true,
    }).then(modal => {
        modal.show();
    });
}
function setup_send_emails() {
    // Pop-up notification when .btn-local-organization-delete-advisor is clicked
    const send_button = document.getElementById('early-alert-send-button1');
    const send_button2 = document.getElementById('early-alert-send-button2');
    var ids = document.getElementById("early-alert-student-ids").value; // hidden field ids
    send_button.addEventListener('click', function () {
        create_notification_dialog(ids);
    });
    send_button2.addEventListener('click', function () {
        create_notification_dialog(ids);
    });
}

function create_notification_dialog(ids) {
    // Get the data id attribute value
    var send_string = getString('send_email', 'local_earlyalert');
    var send_dialog_text = getString('send_dialog_text', 'local_earlyalert');
    var send = getString('send', 'local_earlyalert');
    var cancel = getString('cancel', 'local_earlyalert');
    var sent_email = getString('sent_email', 'local_earlyalert');
    var could_not_send_email = getString('could_not_send_email', 'local_earlyalert');
    var sent_dialog_text = getString('sent_dialog_text', 'local_earlyalert');

    // Notification
    notification.confirm(send_string, send_dialog_text, send, cancel, function () {
        // Delete the record
        var sendEmail = ajax.call([{
            methodname: 'local_earlyalert_sendEmail',
            args: {
                id: ids,
            }
        }]);
        sendEmail[0].done(function () {
            // success
            notification.alert('Email', sent_email);
        }).fail(function () {
            //notification.alert(could_not_send_email);
            notification.alert('Email', sent_dialog_text);
        });
    });
}


function show_grades() {
    // check box for grade showing - remove later
    const show_grade_checkbox = document.getElementById('id_early_alert_filter_grade_chk');
    // check box for grade showing - remove later
    show_grade_checkbox.addEventListener('click', function () {
        let grade_pills = document.querySelectorAll("span.pill");
        grade_pills.forEach(function (grade_pill) {
            if (show_grade_checkbox.checked) {
                if (grade_pill.style.display == 'none') {
                    grade_pill.style.display = 'block';
                }
            } else {
                grade_pill.style.display = 'none';
            }
        });
    });
}

/**
 * Get users from the search input
 */
function get_users() {
    const inputElement = document.getElementById('search');
    const datalistElement = document.getElementById('early-alert-impersonate');

    // Event listener for input element
    inputElement.addEventListener('input', function (event) {
        const query = event.target.value;
        var get_users = ajax.call([{
            methodname: 'organization_users_get',
            args: {
                name: query
            }
        }]);
        /*get_users[0].done(function (users) {
            console.log(users);
            datalistElement.innerHTML = '';
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.text = user.firstname + ' ' + user.lastname;
                datalistElement.appendChild(option);
            });
            // When a selection is made, reload the page with the user_id as a parameter
            inputElement.addEventListener('change', function (event) {
                window.location.href = window.location.href + '?user_id=' + event.target.value;
            });

        }).fail(function (e) {
            alert(e);
            // fail gracefully somehow :'( ;
        });*/
    });
}

function get_templates() {
    const templatecache = document.getElementById('early-alert-template-cache');

    // Event listener for input element
    inputElement.addEventListener('input', function (event) {
        const query = event.target.value;
        var get_templates = ajax.call([{
            methodname: 'organization_users_get',
            args: {
                name: query
            }
        }]);
        get_templates[0].done(function (users) {
            console.log(users);
            datalistElement.innerHTML = '';
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.text = user.firstname + ' ' + user.lastname;
                datalistElement.appendChild(option);
            });
            // When a selection is made, reload the page with the user_id as a parameter
            inputElement.addEventListener('change', function (event) {
                window.location.href = window.location.href + '?user_id=' + event.target.value;
            });

        }).fail(function (e) {
            alert(e);
            // fail gracefully somehow :'( ;
        });
    });
}