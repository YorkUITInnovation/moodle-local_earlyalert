import ajax from 'core/ajax';
import Templates from 'core/templates';
import ModalFactory from 'core/modal_factory';
import ModalEvents from 'core/modal_events';
import {get_string as getString} from 'core/str';
import notification from 'core/notification';
import {get_format as formatString} from 'core/str';
import selectBox from 'local_earlyalert/select_box';
import config from 'core/config';

export const init = () => {
    alert_type_button();
    get_users();
};

function alert_type_button() {
    // Get data-link when .early-alert-type-button link is clicked
    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('early-alert-type-button')) {
            let alert_type = event.target.getAttribute('data-link');
            let course_name = event.target.getAttribute('data-name');
            let course_id = event.target.getAttribute('data-course_id');
            let teacher_user_id = document.getElementById('early-alert-teacher-user-id').value;
            // console.log('teacher_user_id:', teacher_user_id);
            // Get student list based on alert type
            setup_filter_students_by_grade(course_id, 9, course_name, alert_type, teacher_user_id);
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
    const grade_select = document.getElementById('id_early_alert_filter_grade_select') || {};
    const course_id = document.getElementById('early_alert_filter_course_id').value;
    const course_name = document.getElementById('early_alert_course_name').value;
    const alert_type = document.getElementById('early-alert-alert-type').value;
    const teacher_user_id = document.getElementById('early-alert-teacher-user-id').value;
    // setup listener for drop down selection
    grade_select.addEventListener('change', function (e) {
        let grade_letter_id = e.target.value;
        setup_filter_students_by_grade(course_id, grade_letter_id, course_name, alert_type, teacher_user_id);

    });
}

function filter_students_by_assignment() {


    // Get the s delected grade value from the dropdown
    const grade_select = document.getElementById('id_early_alert_filter_grade_select') || {};
    const course_id = document.getElementById('early_alert_filter_course_id').value;
    const course_name = document.getElementById('early_alert_course_name').value;
    const alert_type = document.getElementById('early-alert-alert-type').value;
    const teacher_user_id = document.getElementById('early-alert-teacher-user-id').value;
    // setup listener for drop down selection
    const assignment_input = document.getElementById('early-alert-assignment-title');
    assignment_input.addEventListener('focusout', function (evt) {
        var assignment_title = document.getElementById('early-alert-assignment-title').value;
        if (assignment_title) {
            setup_filter_students_by_grade(course_id, '9', course_name, alert_type, teacher_user_id, assignment_title);
        }
    });
}

/**
 * Fetches the student list based on the course_id and grade_letter_id
 * @param course_id
 * @param grade_letter_id
 * @param course_name
 * @param alert_type
 */
function setup_filter_students_by_grade(course_id, grade_letter_id, course_name, alert_type, teacher_user_id, assignment_title = "") {
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

        const finalCache = new Map();

        // Fetch student list and templates
        var get_grades_and_templates = ajax.call([
            {methodname: 'earlyalert_course_grades_percent_get', args: {"id": course_id, "grade_letter_id": grade_letter_id, "teacher_user_id": teacher_user_id}},
            {methodname: 'earlyalert_course_student_templates', args: {"teacher_user_id": teacher_user_id, "id": course_id, "alert_type": alert_type}}
        ]);
        Promise.all(get_grades_and_templates)
            .then(([grades_response, templates_response]) => {

            // Reformat the data to display in a grid
            let num_students = grades_response.length;
            // console.log('Number of students returned: ' + num_students);
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
                    if (!templates.includes('course_' + course_id)) {
                        templates.push('course_' + course_id);
                    }

                    if (!templates.includes(result.campus)) {
                        templates.push(result.campus);
                    }

                    if (!templates.includes(result.campus + "_" + result.faculty)) {
                        templates.push(result.campus + "_" + result.faculty);
                    }

                    if (!templates.includes(result.campus + "_" + result.faculty + "_" + result.major)) {
                        templates.push(result.campus + "_" + result.faculty + "_" + result.major);
                    }

                    result.faculty = result.faculty ? result.faculty : '';
                    result.major = result.major ? result.major : '';
                    result.campus = result.campus ? result.campus : '';
                    result.courseid = course_id;
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
                    if (alert_type === 'grade') {
                        let grade_select = document.getElementById('id_early_alert_filter_grade_select') || {};
                        grade_select.value = grade_letter_id;
                        // setup listener for filtering students by grade drop down
                        filter_students_by_grade_select();
                    }
                    if (alert_type === 'assign') {
                        document.getElementById('early-alert-assignment-title').value = assignment_title;
                        filter_students_by_assignment();
                    }

                    // we're not doing any more
                    // check_all_student_grades(selected_students);
                    check_allnone_listener(selected_students);

                    const cachedArrayElement = document.getElementById('early-alert-template-cache');
                    const cachedArray = JSON.parse(cachedArrayElement.value);
                    templates_response.forEach(result => {
                        if (typeof result === 'object') {
                            if (cachedArray.includes(result.templateKey)) {
                                let finalMessage = {
                                    subject: result.subject,
                                    message: result.message,
                                    templateid: result.templateid,
                                    revision_id: result.revision_id,
                                    course_id: result.course_id,
                                    instructor_id: result.instructor_id,
                                    triggered_from_user_id: result.triggered_from_user_id,
                                };
                                finalCache.set(result.templateKey, finalMessage);
                            }
                        }
                    });
                    finalCache.set('course_name', course_name);
                    // case where assignment titles are taken from user input
                    if (alert_type === 'assign') // we have to setup the assignment title before previewing!
                    {
                        finalCache.set('assignment_title', assignment_title);

                        if (assignment_title) { // there is a case where previews were setup without titles then dont create modals
                            setup_preview_emails_with_titles(finalCache); // call back function
                        }

                    } else { // for other alert types
                        setup_preview_emails(finalCache);
                    }
                })
                .catch(function (error) {
                    console.error('Failed to render template:', error);
                });
        })
            .catch(error => {
                console.error('Error fetching grades and templates:', error);
                if (error.message) {
                    console.error('Error message:', error.message);
                }
                if (error.stack) {
                    console.error('Error stack:', error.stack);
                }
                if (error.response) {
                    console.error('Error response:', error.response);
                }
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

// function to save to hidden field on submit if anyone unchecks student records
function check_individual_students_checkboxes_for_submit() {
    let selected_students = [];
    const student_ids_selected = document.getElementById("early-alert-student-ids") || {};
    const student_checkboxes = document.querySelectorAll("input[class^='early-alert-student-checkbox']");
    student_checkboxes.forEach(function (checkbox) {
        if (checkbox.checked) {
            selected_students.push(checkbox.getAttribute('data-student-id'));
        }
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
// needed to watch for changes in the dom to setup the preview buttons
function setup_preview_emails(templateCache) {
    const observer = new MutationObserver((mutationsList, observer) => {
        console.log('MutationObserver triggered');
        for (let mutation of mutationsList) {
            if (mutation.type === 'childList') {
                console.log('Child list mutation detected');
                const preview_buttons = document.querySelectorAll(".early-alert-preview-button");
                if (preview_buttons.length > 0) {
                    observer.disconnect(); // Stop observing once the elements are found
                    console.log('Initializing preview buttons since its ready');
                    console.log('Amt of buttons: ' .preview_buttons.length);
                    console.log('template Cache: ' .templateCache );
                    initialize_preview_buttons(preview_buttons, templateCache);
                }
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

function initialize_preview_buttons(preview_buttons, templateCache) {

    // Get the early-alert-alert-type value
    const alert_type = document.getElementById('early-alert-alert-type').value;
    // Loop through each checkbox and toggle its selection based on the state of the select all checkbox
    //console.log("template cache:", templateCache);
    // store ALL the student data and template cache etc when its processed
    let student_template_cache_array = [];
    console.log('Setting up previews');
    preview_buttons.forEach(function (button) {
        let record_data = {};
        const checkbox = button.closest('tr').querySelector('.early-alert-student-checkbox');
        const assigngrade = button.closest('tr').querySelector('.early-alert-grade-column').querySelector('.badge').innerHTML;
        let selected_grade = '';
        let selected_grade_value = 0;
        if (alert_type === 'grade') { // we only use grade/select etc in this alert type
            const grade_select = document.getElementById('id_early_alert_filter_grade_select') || {};
            selected_grade = grade_select.options[grade_select.selectedIndex].text;
            selected_grade_value = grade_select.value;
        }

        let templateObj = {};
        if (checkbox) {
            // now, access the parent <tr> element (the table row)
            const table_row = checkbox.parentNode;
            console.log('Preview table row:' . table_row);
            // extract the student name from the second <td> element within the table row
            const student_name_td = table_row.nextElementSibling;
            console.log('Student name td: '. student_name_td);
            // fix and parse the name
            const student_lname_fname = student_name_td.firstChild;
            var student_name_arr = [];
            var student_name = "";
            student_lname_fname.data.split(/\s*,\s*/).forEach(function (me) {
                student_name_arr.push(me);
            });
            student_name = student_name_arr[1] + ' ' + student_name_arr[0];
            console.log('Student name '. student_name);

            var student_id = checkbox.getAttribute('data-student-id');
            const studentCampusAttr = checkbox.getAttribute('data-student-campus');
            const studentFacultyAttr = checkbox.getAttribute('data-student-faculty');
            const studentMajorAttr = checkbox.getAttribute('data-student-major');
            const courseIdAttr = checkbox.getAttribute('data-courseid');
            var courseTemplateKey = 'course_' + courseIdAttr;
            var campusTemplateKey = studentCampusAttr;
            var facTemplateKey = studentCampusAttr + '_' + studentFacultyAttr;
            var deptTemplateKey = studentCampusAttr + '_' + studentFacultyAttr + '_' + studentMajorAttr;
            var templateEmailContent = '';
            var templateEmailSubject = '';

            if (templateCache.has(campusTemplateKey)) {
                // console.log("department cache found:", templateCache.get(campusTemplateKey));
                templateEmailSubject = templateCache.get(campusTemplateKey).subject;
                templateEmailContent = templateCache.get(campusTemplateKey).message;
                templateObj = templateCache.get(campusTemplateKey);
            } else if (templateCache.has(facTemplateKey)) {
                if (templateCache.has(deptTemplateKey)) {
                    // console.log("faculty cache found:", templateCache.get(deptTemplateKey));
                    templateEmailSubject = templateCache.get(deptTemplateKey).subject;
                    templateEmailContent = templateCache.get(deptTemplateKey).message;
                    templateObj = templateCache.get(deptTemplateKey);
                } else {
                    // console.log("faculty cache found:", templateCache.get(facTemplateKey));
                    templateEmailSubject = templateCache.get(facTemplateKey).subject;
                    templateEmailContent = templateCache.get(facTemplateKey).message;
                    templateObj = templateCache.get(facTemplateKey);
                }
            } else if (templateCache.has(deptTemplateKey)) {
                // console.log("faculty cache found:", templateCache.get(deptTemplateKey));
                templateEmailSubject = templateCache.get(deptTemplateKey).subject;
                templateEmailContent = templateCache.get(deptTemplateKey).message;
                templateObj = templateCache.get(deptTemplateKey);
            } else if (templateCache.has(courseTemplateKey)) {
                //console.log("course cache found:", templateCache.get(courseTemplateKey));
                templateEmailSubject = templateCache.get(courseTemplateKey).subject;
                templateEmailContent = templateCache.get(courseTemplateKey).message;
                templateObj = templateCache.get(courseTemplateKey);
            } else {
                templateEmailSubject = 'Template not found';
                templateEmailContent = 'Template not found';
            }

        } else {
            // console.log("couldn't find checkbox :/");
        }

        if (assigngrade) {
            // console.log("assign grade: ", assigngrade);
        }
        // console.log("template email content:", templateEmailContent);

        var assignment_title = '';

        var params = {
            studentname: student_name_arr,
            assignmentgrade: assigngrade,
            assignmenttitle: templateCache.get('assignment_title'),
            coursename: templateCache.get('course_name'),
            customgrade: selected_grade ? selected_grade : 'D+',
            defaultgrade: "D+"
        };

        //console.log("passing these params to adduserinfo:", params);
        templateEmailContent = addUserInfo(templateEmailContent, params);

        // console.log("template email content post-addUserInfo:", templateEmailContent);

        // assemble record data for individual buttons which includes student and template data
        record_data.student_id = student_id;
        record_data.student_name = student_name;
        record_data.course_name = templateCache.get('course_name');
        record_data.templateEmailSubject = templateEmailSubject;
        record_data.templateEmailContent = templateEmailContent;
        record_data.template_id = templateObj.templateid;
        record_data.revision_id = templateObj.revision_id;
        record_data.triggered_from_user_id = templateObj.triggered_from_user_id;
        record_data.target_user_id = student_id;
        record_data.course_id = templateObj.course_id;
        record_data.instructor_id = templateObj.instructor_id;
        record_data.assignment_name = params.assignmenttitle;
        record_data.actual_grade = assigngrade;
        record_data.trigger_grade = selected_grade_value;

        // case where previews are just added to grade alert type and missed exam etc
        if (alert_type !== 'assign') {
            button.addEventListener('click', function () {
                console.log('Data sent to template from template cache:', record_data);
                setup_preview_buttons_from_template(record_data);
            });
        }
        // add record to student_template_cache_array to have data to submit / email
        // console.log("record data =", record_data);
        student_template_cache_array.push(record_data);

    });

    // once we have all the data we can setup the emails to submit with the template cache data and student ids BUT we have to manage and select the users if they are checked/unchceked
    setup_send_emails(student_template_cache_array);
}

function setup_preview_emails_with_titles(templateCache) {
    // console.log("template cache = ", templateCache);
    const preview_buttons = document.querySelectorAll(".early-alert-preview-button");
    // Get the early-alert-alert-type value
    const alert_type = document.getElementById('early-alert-alert-type').value;
    // Loop through each checkbox and toggle its selection based on the state of the select all checkbox
    //console.log("template cache:", templateCache);
    // store ALL the student data and template cache etc when its processed
    let student_template_cache_array = [];
    preview_buttons.forEach(function (button) {
        button.removeEventListener('click', null);
        let record_data = {};
        const checkbox = button.closest('tr').querySelector('.early-alert-student-checkbox');
        const assigngrade = button.closest('tr').querySelector('.early-alert-grade-column').querySelector('.badge').innerHTML;
        let selected_grade = '';
        let selected_grade_value = 0;
        if (alert_type === 'grade') { // we only use grade/select etc in this alert type
            const grade_select = document.getElementById('id_early_alert_filter_grade_select') || {};
            selected_grade = grade_select.options[grade_select.selectedIndex].text;
            selected_grade_value = grade_select.value;
        }

        let templateObj = {};
        if (checkbox) {

            // now, access the parent <tr> element (the table row)
            const table_row = checkbox.parentNode;
            // extract the student name from the second <td> element within the table row
            const student_name_td = table_row.nextElementSibling;
            // fix and parse the name
            const student_lname_fname = student_name_td.firstChild;
            var student_name_arr = [];
            var student_name = "";
            student_lname_fname.data.split(/\s*,\s*/).forEach(function (me) {
                student_name_arr.push(me);
            });
            student_name = student_name_arr[1] + ' ' + student_name_arr[0];
            // console.log(student_name);
            var student_id = checkbox.getAttribute('data-student-id');
            const studentCampusAttr = checkbox.getAttribute('data-student-campus');
            const studentFacultyAttr = checkbox.getAttribute('data-student-faculty');
            const studentMajorAttr = checkbox.getAttribute('data-student-major');
            const courseIdAttr = checkbox.getAttribute('data-courseid');
            var courseTemplateKey = 'course_' + courseIdAttr;
            var campusTemplateKey = studentCampusAttr;
            var facTemplateKey = studentCampusAttr + '_' + studentFacultyAttr;
            var deptTemplateKey = studentCampusAttr + '_' + studentFacultyAttr + '_' + studentMajorAttr;
            var templateEmailContent = '';
            var templateEmailSubject = '';

            if (templateCache.has(campusTemplateKey)) {
                // console.log("department cache found:", templateCache.get(campusTemplateKey));
                templateEmailSubject = templateCache.get(campusTemplateKey).subject;
                templateEmailContent = templateCache.get(campusTemplateKey).message;
                templateObj = templateCache.get(campusTemplateKey);
            } else if (templateCache.has(facTemplateKey)) {
                if (templateCache.has(deptTemplateKey)) {
                    // console.log("faculty cache found:", templateCache.get(deptTemplateKey));
                    templateEmailSubject = templateCache.get(deptTemplateKey).subject;
                    templateEmailContent = templateCache.get(deptTemplateKey).message;
                    templateObj = templateCache.get(deptTemplateKey);
                } else {
                    // console.log("faculty cache found:", templateCache.get(facTemplateKey));
                    templateEmailSubject = templateCache.get(facTemplateKey).subject;
                    templateEmailContent = templateCache.get(facTemplateKey).message;
                    templateObj = templateCache.get(facTemplateKey);
                }
            } else if (templateCache.has(deptTemplateKey)) {
                // console.log("faculty cache found:", templateCache.get(deptTemplateKey));
                templateEmailSubject = templateCache.get(deptTemplateKey).subject;
                templateEmailContent = templateCache.get(deptTemplateKey).message;
                templateObj = templateCache.get(deptTemplateKey);
            } else if (templateCache.has(courseTemplateKey)) {
                //console.log("course cache found:", templateCache.get(courseTemplateKey));
                templateEmailSubject = templateCache.get(courseTemplateKey).subject;
                templateEmailContent = templateCache.get(courseTemplateKey).message;
                templateObj = templateCache.get(courseTemplateKey);
            } else {
                templateEmailSubject = 'Template not found';
                templateEmailContent = 'Template not found';
            }

        } else {
            // console.log("couldn't find checkbox :/");
        }

        if (assigngrade) {
            // console.log("assign grade: ", assigngrade);
        }
        // console.log("template email content:", templateEmailContent);

        var assignment_title = '';

        var params = {
            studentname: student_name_arr,
            assignmentgrade: assigngrade,
            assignmenttitle: templateCache.get('assignment_title'),
            coursename: templateCache.get('course_name'),
            customgrade: selected_grade ? selected_grade : 'D+',
            defaultgrade: "D+"
        };
        //console.log("passing these params to adduserinfo:", params);
        templateEmailContent = addUserInfo(templateEmailContent, params);

        // console.log("template email content post-addUserInfo:", templateEmailContent);

        // assemble record data for individual buttons which includes student and template data
        record_data.student_id = student_id;
        record_data.student_name = student_name;
        record_data.course_name = templateCache.get('course_name');
        record_data.templateEmailSubject = templateEmailSubject;
        record_data.templateEmailContent = templateEmailContent;
        record_data.template_id = templateObj.templateid;
        record_data.revision_id = templateObj.revision_id;
        record_data.triggered_from_user_id = templateObj.triggered_from_user_id;
        record_data.target_user_id = student_id;
        record_data.course_id = templateObj.course_id;
        record_data.instructor_id = templateObj.instructor_id;
        record_data.assignment_name = params.assignmenttitle;
        record_data.actual_grade = assigngrade;
        record_data.trigger_grade = selected_grade_value;

        button.addEventListener('click', function () {
            setup_preview_buttons_from_template(record_data);
        });
        student_template_cache_array.push(record_data);

    });
    setup_send_emails(student_template_cache_array);
}

var current_modal = null;

function setup_preview_buttons_from_template(student_template_data) {
    console.log('Modal created with: '.student_template_data);
    ModalFactory.create({
        title: getString('preview_email', 'local_earlyalert'),
        type: ModalFactory.types.CANCEL,
        body: Templates.render('local_earlyalert/preview_student_email', {
            name: student_template_data.template_name,
            student_name: student_template_data.student_name,
            subject: student_template_data.templateEmailSubject,
            message: student_template_data.templateEmailContent,
            instructor_name: ''
        }),
        large: true,

    }).done(modal => {
        modal.show();
        current_modal = modal;
        // modal.getRoot().on(ModalEvents.cancel, function(){
        //     current_modal.getRoot().remove();
        // });

        return current_modal;
    });

}

function setup_send_emails(student_template_cache_array) {
    const send_button = document.getElementById('early-alert-send-button1');
    const send_button2 = document.getElementById('early-alert-send-button2');
    send_button.addEventListener('click', function () {
        maintain_student_template_data_for_submit(student_template_cache_array);
    });
    send_button2.addEventListener('click', function () {
        maintain_student_template_data_for_submit(student_template_cache_array);
    });
}

function maintain_student_template_data_for_submit(student_template_cache_array) {
    check_individual_students_checkboxes_for_submit();
    var student_ids_array = JSON.parse(document.getElementById("early-alert-student-ids").value); // hidden field ids
    // remove students from template cache if they have been unchecked
    var new_student_temp_array = student_template_cache_array.filter(student => student_ids_array.includes(student.student_id));
    new_student_temp_array.length > 0 ? create_notification_dialog(new_student_temp_array) : alert('No students selected');
}

function create_notification_dialog(student_template_cache_array) {

    // Get the data id attribute value
    var send_string = getString('send_email', 'local_earlyalert');
    var send_dialog_text = getString('send_dialog_text', 'local_earlyalert');
    var send = getString('send', 'local_earlyalert');
    var cancel = getString('cancel', 'local_earlyalert');
    var could_not_send_email = getString('could_not_send_email', 'local_earlyalert');
    var sent_dialog_text = getString('sent_dialog_text', 'local_earlyalert');

    // Notification
    notification.confirm(send_string, send_dialog_text, send, cancel, function () {

        // send emails and save records
        var sendEmail = ajax.call([{
            methodname: 'earlyalert_report_log_insert',
            args: {
                template_data: JSON.stringify(student_template_cache_array),
            }
        }]);
        sendEmail[0].done(function () {
            // success
            sendEmail[0].then(result => {
                    notification.alert('Email', getString('sent_dialog_text', 'local_earlyalert', result));
                }
            );
        }).fail(function () {
            notification.alert(could_not_send_email);
        });
    });
}

function get_users() {
    selectBox.init('#search', 'earlyalert_get_users', "Select a user");
    // On search change, navigate to a url with the user_id as a parameter
    let search = document.getElementById('search');
    if (search) {
        document.getElementById('search').addEventListener('change', function (event) {
            window.location.href = config.wwwroot + '/local/earlyalert/dashboard.php?user_id=' + search.value;
        });
    }
}

function addUserInfo(emailText, params) {
    // Define text replacements
    const textReplace = [
        '[firstname]',
        '[fullname]',
        '[usergrade]',
        '[grade]',
        '[coursetitle]',
        '[assignmenttitle]'
    ];

    // Build replacement info
    let uniqueMatches = {};
    for (let i = 0; i < textReplace.length; i++) {
        if (emailText.includes(textReplace[i])) {
            // Perform action for each unique match found
            switch (i) {
                case 0:
                    // firstname action
                    let firstNameText = params.studentname[1] ? params.studentname[1] : '{USER_NOT_FOUND}';
                    uniqueMatches[i] = firstNameText;
                    break;
                case 1:
                    // fullname action
                    let targetUser = params.studentname[1] ? `${params.studentname[1]} ${params.studentname[0]}` : '{USER_NOT_FOUND}';
                    uniqueMatches[i] = targetUser;
                    break;
                case 2:
                    // usergrade action
                    let userGradeText = params.assignmentgrade || '{USER GRADE NOT PROVIDED/FOUND}';
                    uniqueMatches[i] = userGradeText;
                    break;
                case 3:
                    // grade acton
                    let defaultGradeText = params.customgrade || (params.defaultgrade ? params.defaultgrade : '{GRADE NOT PROVIDED/FOUND}');
                    uniqueMatches[i] = defaultGradeText;
                    break;
                case 4:
                    // coursetitle action
                    let courseTitleText = params.coursename || '{COURSE TITLE NOT FOUND}';
                    uniqueMatches[i] = courseTitleText;
                    break;
                case 5:
                    // assignmenttitle action
                    let assignmentTitleText = params.assignmenttitle || '{ASSIGNMENT TITLE NOT FOUND}';
                    uniqueMatches[i] = assignmentTitleText;
                    break;
            }
        }
    }
    // Replace the text with the matched values
    for (let i = 0; i < textReplace.length; i++) {
        if (uniqueMatches[i]) {
            emailText = emailText.replace(textReplace[i], uniqueMatches[i]);
        }
    }
    return emailText;
}
