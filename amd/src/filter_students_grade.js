import ajax from 'core/ajax';
import Templates from 'core/templates';
import ModalFactory from 'core/modal_factory';
import {get_string as getString} from 'core/str';
import notification from 'core/notification';

export const init = () => {
    button_click();
    filter_students_by_default_grade();
};

function button_click() {
    // Get data-link when .early-alert-type-button link is clicked
    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('early-alert-type-button')) {
            let dataLink = event.target.getAttribute('data-link');
            let link = event.target.getAttribute('data-href');
            let course_name = event.target.getAttribute('data-name');
            // Redirect to the link
            window.location = link + '&alert_type=' + dataLink + '&course_name=' + course_name;
        }
    });
}


/**
 * Adds students with grades
 */
function filter_students_by_default_grade() {

    // Get course id from the hidden input field wiht id early_alert_filter_course_id
    const course_id = document.getElementById('early_alert_filter_course_id').value;
    // initial default setup of student list
    setup_filter_students_by_grade(course_id, 9); // extract this 9 from php which might be configurable in the future

}

function filter_students_by_grade_select(){

    // Get the s delected grade value from the dropdown
    const grade_select = document.getElementById('id_early_alert_filter_grade_select');
    const course_id = document.getElementById('early_alert_filter_course_id').value;
    // setup listener for drop down selection

    grade_select.addEventListener('change', function (e) {
        let grade_letter_id = e.target.value;
        setup_filter_students_by_grade(course_id, grade_letter_id);

    });

}

function setup_filter_students_by_grade(course_id, grade_letter_id) {
    let selected_students = [];
    // convert course_id into an integer
    course_id = parseInt(course_id);
    grade_letter_id = parseInt(grade_letter_id);
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    let course_name = urlParams.get('course_name');

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

        // Fetch the student list
        var get_filtered_studentgrades = ajax.call([{
            methodname: 'earlyalert_course_grades_percent_get',
            args: {
                id: course_id,
                grade_letter_id: grade_letter_id
            }
        }]);
        get_filtered_studentgrades[0].done(function (results) {

            // Reformat the data to display in a grid
            let num_students = results.length;
            console.log('Number of students returned: ' + num_students);
            let num_rows = Math.min(3, Math.ceil(num_students / 3));
            let num_cols = Math.ceil(num_students / num_rows);
            let display_data = {
                num_rows: num_rows,
                num_cols: num_cols,
                student_rows: []
            };

// Initialize rows array
            for (let r = 0; r < num_rows; r++) {
                display_data.student_rows[r] = {students: []};
            }

            let row = 0;
            let col = 0;

            results.forEach(result => {
                if (typeof result === 'object') {
                    display_data.student_rows[row].students[col] = result;
                    col++;
                    if (col === num_cols) {
                        col = 0;
                        row++;
                    }
                }
            });

            // Get alert type
            let alert_type = document.getElementById('early-alert-alert-type').value;

            if (alert_type === 'grade') {
                // Add alert_type to display_data
                display_data.alert_type = 'Low Grade';
            }

            if (alert_type === 'assign') {
                // Add alert_type to display_data
                display_data.alert_type = 'Missed Assignment';
            }

            if (alert_type === 'exam') {
                // Add alert_type to display_data
                display_data.alert_type = 'Missed Exam';
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
                    filter_students_by_grade_select();
                    check_all_student_grades(selected_students);
                    check_allnone_listener(selected_students);
                    setup_preview_emails();
                    setup_send_emails();

                })
                .catch(function (error) {
                    console.error('Failed to render template:', error);
                });
        }).fail(function (e) {
            alert(e);
            // fail gracefully somehow :'( ;
        });
    }
}

/**
 *  Filter your data based on the selected grade value (for example)
 * @param course_id
 * @param $grade_letter_id
 * @deprecated
 */
function setup_filter_students_by_grade_original(course_id, $grade_letter_id) {
    let selected_students = [];

    var get_filtered_studentgrades = ajax.call([{
        methodname: 'earlyalert_course_grades_percent_get',
        args: {
            id: course_id,
            grade_letter_id: $grade_letter_id
        }
    }]);
    get_filtered_studentgrades[0].done(function (results) {
        //results.filter(item => item.grade === parseInt(selectedGrade));
        //let t = selectedGrade;
        // Update your page with the filtered data

        const students_gradesList = document.getElementById('early_alert_filter_students_container');
        students_gradesList.innerHTML = '';
        const ulElement = document.createElement('ul');

        let select_all_checkbox = document.createElement('INPUT');
        select_all_checkbox.type = 'checkbox';
        select_all_checkbox.className = 'early_alert_filterform_select_all_checkbox';
        select_all_checkbox.id = 'early_alert_filterform_select_all_checkbox_0';

        let select_all_li = document.createElement('LI');

        // Create a label for the select allcheckbox
        let select_all_label = document.createElement('LABEL');
        select_all_label.textContent = 'Select All/None';
        select_all_label.htmlFor = 'early_alert_filterform_select_all_checkbox';

        let no_record = document.createElement('LABEL');
        no_record.textContent = 'No records';
        no_record.id = 'early_alert_filterform_li_nothing';

        select_all_li.appendChild(select_all_checkbox);
        select_all_li.appendChild(select_all_label);
        ulElement.appendChild(select_all_li);
        let i = 0;

        let student_ids_selected = document.querySelector('input[name="student_ids"]') || {};
        student_ids_selected.value = [];
        // Create an unordered list for each grade
        results.forEach((item) => {

            // Create a new list item (LI) element
            let li = document.createElement('LI');
            let checkbox = document.createElement('INPUT');
            checkbox.type = 'checkbox';
            checkbox.className = 'early_alert_filterform_checkbox';
            checkbox.id = `early_alert_filterform_checkbox_${i}`;
            checkbox.setAttribute('user_id', item.id);

            // Add the checkbox to the list item (LI)
            li.appendChild(checkbox);

            // Create a div for column 1
            let col1Div = document.createElement('DIV');
            col1Div.className = 'column1';

            // Create a label for the checkbox
            let label = document.createElement('LABEL');
            label.textContent = item.idnumber + ' | ' + item.first_name + ' ' + item.last_name;
            label.htmlFor = `early_alert_filterform_checkbox_${i}`;

            // Add the label to column 1 div
            col1Div.appendChild(checkbox);
            col1Div.appendChild(label);

            // Add column 1 div to list item (LI)
            li.appendChild(col1Div);

            // Create a div for column 2
            let col2Div = document.createElement('DIV');
            col2Div.className = 'column2';

            // Create a span for the pill element
            let pillSpan = document.createElement('SPAN');
            pillSpan.className = 'pill red';
            pillSpan.textContent = item.grade;
            pillSpan.id = `early_alert_filterform_grade_pill_${i}`;
            pillSpan.style.display = 'none';

            // Add the pill to column 2 div
            col2Div.appendChild(pillSpan);

            // Create another span for the value text
            let valueSpan = document.createElement('SPAN');
            valueSpan.className = 'value-text';

            // Add the value text to column 2 div
            col2Div.appendChild(valueSpan);

            // Add column 2 div to list item (LI)
            li.appendChild(col2Div);
            ulElement.appendChild((li));
            i++;
        });
        students_gradesList.appendChild(ulElement);

        // Add an event listener to the select all checkbox
        select_all_checkbox.addEventListener('change', function () {
            // Get all checkboxes within the list
            let checkboxes = document.querySelectorAll("input[class^='early_alert_filterform_checkbox']");
            // Loop through each checkbox and toggle its selection based on the state of the select all checkbox
            checkboxes.forEach(function (checkbox) {
                if (select_all_checkbox.checked) {
                    checkbox.checked = true;
                    selected_students.push(checkbox.getAttribute('user_id'));
                } else {
                    checkbox.checked = false;
                    selected_students = selected_students.filter(item => item !== checkbox.getAttribute('user_id'));
                }
            });
            student_ids_selected.value = JSON.stringify(selected_students);

        });
        // search dom for checkboxes and add to checked list
        let grade_checkboxes = document.querySelectorAll("input[class^='early_alert_filterform_checkbox']");
        // Loop through each checkbox and toggle its selection based on the state of the select all checkbox
        grade_checkboxes.forEach(function (checkbox) {
            checkbox.addEventListener('click', function () {
                if (checkbox.checked) {
                    selected_students.push(checkbox.getAttribute('user_id'));
                } else {
                    selected_students = selected_students.filter(item => item !== checkbox.getAttribute('user_id'));
                }
                student_ids_selected.value = JSON.stringify(selected_students);
            });

        });
        show_grades();
    }).fail(function (e) {

        alert(e);
        // fail gracefully somehow :'( ;
    });
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

function check_allnone_listener(selected_students){
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

function setup_preview_emails() {
    const preview_buttons = document.querySelectorAll("input[class^='early-alert-preview-button']");
    // Loop through each checkbox and toggle its selection based on the state of the select all checkbox
    ModalFactory.create({
        title: getString('preview_email', 'local_earlyalert'),
        type: ModalFactory.types.CANCEL,
        body: Templates.render('local_earlyalert/preview_student_email', {name: 'etemplate name', student_name: 'Fred', subject: 'Grade in AP/ECON 2350 3.00' , message: '<p> We know that many students juggle a lot alongside their academics. The academic advising team at the Faculty of Liberal Arts and Professional Studies works with professors to ensure that students receive information about their course progress so that way we can work with those who are facing challenges.<br>' +
                '    We’re reaching out because your course director, Nick Valentino, has notified our office that you are averaging less than D+ in AP/ECON 2350 3.00, which puts you in danger of failing. </p>' +
                '    <p><b><u>Your next step: Book an appointment with an advisor</u></b><br>' +
                '    We want you to know that you’re not alone – it’s not uncommon for students to experience academic difficulties. We’re here to support you, and so we’re inviting you to a coaching session with your advisors at LA&PS Academic Advising Services. <u>Connect with them</u> at a day or time that is convenient for you!</p>' +
                '    <p><b><u>Other helpful resources</u></b></br>' +
                '    Looking for ways to manage your time? Study and learn more effectively? Keep up with readings and course work? Let <u>Learning Skills Services</u> help you achieve those goals.</br>' +
                '    Feeling like you could use some extra support outside of the classroom? Explore <u>counselling and wellness resources </u>designed to help you navigate challenges and thrive throughout your journey here with us.</br>' +
                '    Just not the course for you? That’s totally okay too. If this is the case just be sure that you are aware of the drop/withdraw deadlines, and what they mean.</br>' +
                '    <p>Have unanswered questions? Why not <u>chat with SAVY?</u> You can ask SAVY about programs and courses, student life, campus services, career development and more.</p> ', instructor_name: ''}),
        large: true,

    }).then(modal => {
        const preview_buttons = document.querySelectorAll(".early-alert-preview-button");
        preview_buttons.forEach(function (button) {
            button.addEventListener('click', function () {
                modal.show();
            });
        });
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
            notification.alert('Email',sent_dialog_text);
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