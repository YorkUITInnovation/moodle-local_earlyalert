import ajax from 'core/ajax';
export const init = () => {
    filter_students_by_grade();
};

/**
 * Adds students with grades
 */
function filter_students_by_grade() {

    // Get the s delected grade value from the dropdown
    const selected_grade = document.getElementById('id_early_alert_filter_grade_select').value;
    const course_id = document.getElementsByName('early_alert_filter_course_id')[0].value;
    // Filter your data based on the selected grade value (for example)
    // Delete the record
    var get_filtered_studentgrades = ajax.call([{
        methodname: 'earlyalert_course_grades_percent_get',
        args: {
            id: course_id,
            grade_id: selected_grade
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
        select_all_label.textContent = 'Select All';
        select_all_label.htmlFor = 'early_alert_filterform_select_all_checkbox';

        select_all_li.appendChild(select_all_checkbox);
        select_all_li.appendChild(select_all_label);
        ulElement.appendChild(select_all_li);
        let i = 0;
        let selected_students = [];
        let student_ids_selected = document.querySelector('input[name="student_ids"]') || {};
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
                label.textContent = item.first_name + ' ' + item.last_name;
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
                pillSpan.textContent = '5'; // move to css
                pillSpan.textContent = item.grade;

                // Add the pill to column 2 div
                col2Div.appendChild(pillSpan);

                // Create another span for the value text
                let valueSpan = document.createElement('SPAN');
                valueSpan.className = 'value-text';
                valueSpan.textContent = '!';

                // Add the value text to column 2 div
                col2Div.appendChild(valueSpan);

                // Add column 2 div to list item (LI)
                li.appendChild(col2Div);
                ulElement.appendChild((li));
                i++;
            });
        students_gradesList.appendChild(ulElement);

        // Add an event listener to the select all checkbox
        select_all_checkbox.addEventListener('change', function() {
            // Get all checkboxes within the list
            let checkboxes = document.querySelectorAll("input[class^='early_alert_filterform_checkbox']");
            // Loop through each checkbox and toggle its selection based on the state of the select all checkbox
            checkboxes.forEach(function(checkbox) {
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
        grade_checkboxes.forEach(function(checkbox) {
            checkbox.addEventListener('click', function() {
                if (checkbox.checked) {
                    selected_students.push(checkbox.getAttribute('user_id'));
                } else {
                    selected_students = selected_students.filter(item => item !== checkbox.getAttribute('user_id'));
                }
                student_ids_selected.value = JSON.stringify(selected_students);
            });

        });
    }).fail(function (e) {

        alert(e.message());
        // fail gracefully somehow :'( ;
    });

}