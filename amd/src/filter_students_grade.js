import ajax from 'core/ajax';
import Templates from 'core/templates';

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