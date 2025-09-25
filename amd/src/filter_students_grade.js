import ajax from 'core/ajax';
import Templates from 'core/templates';
import ModalFactory from 'core/modal_factory';
import ModalEvents from 'core/modal_events';
import {get_string as getString} from 'core/str';
import notification from 'core/notification';
import {get_format as formatString} from 'core/str';
import selectBox from 'local_earlyalert/select_box';
import config from 'core/config';
import selectCourseBox from 'local_earlyalert/select_course_box';

export const init = () => {
    alert_type_button();
    get_users();
    // Set up the custom message listener globally - not tied to any specific alert type
    setup_custom_message_listener();
    // Set up toggle functionality for custom message containers
    setup_custom_message_toggles();
};

/**
 * Sets up event listeners for the custom message textarea
 * Updates the preview text and refreshes templates when the custom message changes
 */
function setup_custom_message_listener() {
    // Single shared textarea for all alert types
    const textarea = document.getElementById('early-alert-custom-message');
    const preview = document.querySelector('.custom-message-preview');

    if (!textarea || !preview) {
        console.log('No custom message textarea or preview found');
        return;
    }

    // Clear previous listeners by cloning
    const new_textarea = textarea.cloneNode(true);
    textarea.parentNode.replaceChild(new_textarea, textarea);

    const updatePreview = () => {
        const message = (new_textarea.value || '').trim();
        if (window.currentTemplateCache) {
            window.currentTemplateCache.set('custom_message', message);
        }
    };

    new_textarea.addEventListener('input', updatePreview);
    new_textarea.addEventListener('blur', () => {
        // Rebuild cache and refresh previews on blur
        const templateCache = build_template_cache();
        const alert_type_el = document.getElementById('early-alert-alert-type');
        const alert_type = alert_type_el ? alert_type_el.value : '';
        if (alert_type === 'assign') {
            const at = document.getElementById('early-alert-assignment-title');
            const assignmentTitle = at ? (at.value || '') : '';
            templateCache.set('assignment_title', assignmentTitle);
            setup_preview_emails_with_titles(templateCache);
        } else {
            setup_preview_buttons(templateCache);
        }
    });
}

// Helper function to rebuild the template cache
function build_template_cache() {
    const template_cache_input_el = document.getElementById('early-alert-template-cache');
    const cached_array = template_cache_input_el ? JSON.parse(template_cache_input_el.value) : [];
    const course_name = document.getElementById('early_alert_course_name').value;
    // Single unified textarea
    const textarea_el = document.getElementById('early-alert-custom-message');
    const custom_message = textarea_el ? textarea_el.value.trim() : '';

    // Build new cache
    const final_cache = new Map();
    final_cache.set('course_name', course_name);
    final_cache.set('custom_message', custom_message);

    // Preserve existing template entries
    const current_cache = window.currentTemplateCache || {};
    if (current_cache && typeof current_cache.forEach === 'function') {
        current_cache.forEach((value, key) => {
            if (key !== 'course_name' && key !== 'custom_message' && key !== 'assignment_title') {
                final_cache.set(key, value);
            }
        });
    }

    window.currentTemplateCache = final_cache;
    return final_cache;
}

function alert_type_button() {
    // Get data-link when .early-alert-type-button link is clicked
    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('early-alert-type-button')) {
            let alert_type = event.target.getAttribute('data-link');
            let course_name = event.target.getAttribute('data-name');
            let course_id = event.target.getAttribute('data-course_id');
            let teacher_user_id = document.getElementById('early-alert-teacher-user-id').value;
            // Choose default grade letter dynamically: 9 for grade alerts, -1 for others (no grade filter)
            const default_grade_letter_id = (alert_type === 'grade') ? 9 : -1;
            setup_filter_students_by_grade(course_id, default_grade_letter_id, course_name, alert_type, teacher_user_id);
        }
    });
}


/**
 * Adds students with grades
 */

function filter_students_by_grade_select() {
    // Get the selected grade value from the dropdown
    const grade_select = document.getElementById('id_early_alert_filter_grade_select') || {};
    const not_using_gradebook_checkbox = document.getElementById('early-alert-not-using-gradebook-checkbox');
    const course_id = document.getElementById('early_alert_filter_course_id').value;
    const course_name = document.getElementById('early_alert_course_name').value;
    const alert_type = document.getElementById('early-alert-alert-type').value;
    const teacher_user_id = document.getElementById('early-alert-teacher-user-id').value;
    
    // Setup listener for drop down selection
    grade_select.addEventListener('change', function (e) {
        let grade_letter_id = e.target.value;
        // Check if "Not using Gradebook" is checked
        if (not_using_gradebook_checkbox && not_using_gradebook_checkbox.checked) {
            // Rebuild template cache with new grade for template parameters
            const templateCache = build_template_cache();
            setup_preview_buttons(templateCache);
        } else {
            setup_filter_students_by_grade(course_id, grade_letter_id, course_name, alert_type, teacher_user_id);
        }
    });

    // Setup listener for "Not using Gradebook" checkbox
    if (not_using_gradebook_checkbox) {
        not_using_gradebook_checkbox.addEventListener('change', function(e) {
            const current_grade = grade_select.value; //get current grade selection at time of checkbox change
            if (e.target.checked) {
                // Show all students regardless of grade selection, but preserve dropdown value
                setup_filter_students_by_grade(course_id, -1, course_name, alert_type, teacher_user_id);
            } else {
                setup_filter_students_by_grade(course_id, current_grade, course_name, alert_type, teacher_user_id);
            }
        });
    }
}

function filter_students_by_assignment() {
    // Get the selected grade value from the dropdown
    const grade_select = document.getElementById('id_early_alert_filter_grade_select') || {};
    const course_id = document.getElementById('early_alert_filter_course_id').value;
    const course_name = document.getElementById('early_alert_course_name').value;
    const alert_type = document.getElementById('early-alert-alert-type').value;
    const teacher_user_id = document.getElementById('early-alert-teacher-user-id').value;

    // Setup listener for assignment title input
    const assignment_input = document.getElementById('early-alert-assignment-title');

    // Add an input event listener for real-time preview of the assignment title
    assignment_input.addEventListener('input', function() {
        const title = assignment_input.value.trim();
        // Validate the assignment title
        validateAssignmentTitle(title);
    });

    // Only update the full preview on focus out to reduce processing
    assignment_input.addEventListener('focusout', function(evt) {
        var assignment_title = assignment_input.value.trim();

        // Validate the assignment title
        if (validateAssignmentTitle(assignment_title)) {
            // For assignment alerts, do not filter by grade; pass -1 to include all students
            setup_filter_students_by_grade(course_id, -1, course_name, alert_type, teacher_user_id, assignment_title);
        }
    });
    validateAssignmentTitle(assignment_input.value.trim());
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
        Templates.render('local_earlyalert/loader', {})
            .then(function (html, js) {
                // Insert the rendered template into the target element
                document.getElementById('early-alert-student-results').innerHTML = html;
                Templates.runTemplateJS(js);
            })
            .catch(function (error) {
                console.error('Failed to render template:', error);
            });

        var finalCache = new Map();

        // Fetch student list and templates
        var get_grades_and_templates = ajax.call([
            {methodname: 'earlyalert_course_grades_percent_get', args: {"id": course_id, "grade_letter_id": grade_letter_id, "teacher_user_id": teacher_user_id}},
            {methodname: 'earlyalert_course_student_templates', args: {"teacher_user_id": teacher_user_id, "id": course_id, "alert_type": alert_type}}
        ]);
        Promise.all(get_grades_and_templates)
            .then(([grades_response, templates_response]) => {
                 //console.log('grade response1: ' , grades_response);
                // console.log('template response1: ' , templates_response);
                // Reformat the data to display in a grid
                let num_students = grades_response.length;
                // console.log('Number of students returned: ' + num_students);
                // Calculate the number of rows and columns for the grid
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
                    // Generating keys for templates with course_id, lang, and idnumber - each template is pulled/created for a student based on their campus/lang/facutly/major
                    if (typeof result === 'object') {
                        if (!templates.includes('course_' + course_id + '_' + result.lang + '_' + result.idnumber)) {
                            var course_lang = 'course_' + course_id + '_' + result.lang + '_' + result.idnumber;
                            templates.push(course_lang);
                        }

                        if (!templates.includes(result.campus + '_' + result.lang + '_' + result.idnumber)) {
                            var campus_lang = result.campus + '_' + result.lang + '_' + result.idnumber;
                            templates.push(campus_lang);
                        }

                        if (!templates.includes(result.campus + "_" + result.faculty + '_' + result.lang + '_' + result.idnumber)) {
                            var campus_fac_lang = result.campus + "_" + result.faculty + '_' + result.lang + '_' + result.idnumber;
                            templates.push(campus_fac_lang);
                        }

                        if (!templates.includes(result.campus + "_" + result.faculty + "_" + result.major + '_' + result.lang + '_' + result.idnumber)) {
                            var campus_fac_maj_lang = result.campus + "_" + result.faculty + "_" + result.major + '_' + result.lang + '_' + result.idnumber;
                            templates.push(campus_fac_maj_lang);
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
                // console.log( templates_response);

                // Set hascustommessage to true if any template has it enabled
                let hascustommessage = 0;
                if (Array.isArray(templates_response) && templates_response.length > 0) {
                    hascustommessage = templates_response.some(
                        t => t && t.hascustommessage === 1
                    ) ? 1 : 0;
                }
                display_data.hascustommessage = hascustommessage;

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

                        // Focus on the checkbox when student list is being rendered
                        focusOnCheckall();

                        // (Re)attach custom message listeners and toggles now that the DOM was re-rendered
                        setup_custom_message_listener();
                        setup_custom_message_toggles();
                        // set default grade letter selected
                        if (alert_type === 'grade') {
                            let grade_select = document.getElementById('id_early_alert_filter_grade_select') || {};
                            const not_using_gradebook_checkbox = document.getElementById('early-alert-not-using-gradebook-checkbox');
                    
                            // If showing all students (grade_letter_id === -1)
                            if (grade_letter_id === -1) {
                                // Store current value before any changes
                                const currentValue = grade_select.value;
                                if (not_using_gradebook_checkbox) {
                                    not_using_gradebook_checkbox.checked = true;
                                }
                                // Restore the previous selection, or default to 9 if none exists
                               // grade_select.value = currentValue && currentValue !== '-1' ? currentValue : 9;
                                grade_select.value = 9; // default to 9 when showing all students
                            } else if (grade_letter_id > 0) {
                                // Normal grade filtering - set dropdown value and uncheck checkbox
                                grade_select.value = grade_letter_id;
                                if (not_using_gradebook_checkbox) {
                                    not_using_gradebook_checkbox.checked = false;
                                }
                            }
                    
                            // Setup listener for filtering students by grade drop down
                            filter_students_by_grade_select();
                        }
                        if (alert_type === 'assign') {
                            document.getElementById('early-alert-assignment-title').value = assignment_title;
                            // Setup assignment field validation and event handlers
                            filter_students_by_assignment();
                        }

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
                        // Ensure custom_message key exists even before user types so downstream lookups never get undefined
                        if (!finalCache.has('custom_message')) {
                            finalCache.set('custom_message', '');
                        }

                        // Store the cache globally so we can access it later when the custom message changes
                        window.currentTemplateCache = finalCache;

                        // case where assignment titles are taken from user input
                        if (alert_type === 'assign') // we have to setup the assignment title before previewing!
                        {
                            finalCache.set('assignment_title', assignment_title);
                            if (assignment_title) { // there is a case where previews were setup without titles then dont create modals
                                setup_preview_emails_with_titles(finalCache); // call back function
                            }

                        } else { // for other alert types
                            // built templates with template keys sent to setup previews
                            setup_preview_buttons(finalCache);
                        }
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

/**
 * Validates the assignment title and updates UI accordingly
 * @param {string} title - The assignment title to validate
 * @returns {boolean} - Whether the title is valid
 */
function validateAssignmentTitle(title) {
    const errorElement = document.getElementById('assignment-title-error');
    const sendButtons = document.querySelectorAll('.early-alert-send-button');
    const previewButtons = document.querySelectorAll('.early-alert-preview-button');

    if (!title) {
        // Title is required - show error and disable buttons
        if (errorElement) {
            errorElement.style.display = 'block';
        }

        // Disable send and preview buttons
        sendButtons.forEach(button => {
            button.disabled = true;
            button.title = 'Assignment title is required';
        });

        previewButtons.forEach(button => {
            button.disabled = true;
            button.classList.add('disabled');
            button.title = 'Assignment title is required';
        });

        return false;
    } else {
        // Title is valid - hide error and enable buttons
        if (errorElement) {
            errorElement.style.display = 'none';
        }

        // Enable send and preview buttons
        sendButtons.forEach(button => {
            button.disabled = false;
            button.title = '';
        });

        previewButtons.forEach(button => {
            button.disabled = false;
            button.classList.remove('disabled');
            button.title = '';
        });

        return true;
    }
}

function setup_preview_buttons(templateCache) {
    // Get the early-alert-alert-type value
    const alert_type = document.getElementById('early-alert-alert-type').value;

    // Get the custom message from the template cache
    const custom_message = templateCache.get('custom_message') || '';

    // Store ALL the student data and template cache etc when its processed
    let student_template_cache_array = [];

    // Remove any existing click event listeners from preview buttons first
    const preview_buttons = document.querySelectorAll(".early-alert-preview-button");
    preview_buttons.forEach(button => {
        const clone = button.cloneNode(true);
        button.parentNode.replaceChild(clone, button);
    });

    // Now add new event listeners
    const fresh_buttons = document.querySelectorAll(".early-alert-preview-button");
    fresh_buttons.forEach(function (button) {
        let record_data = {};
        const checkbox = button.closest('tr').querySelector('.early-alert-student-checkbox');
        const gradeColumn = button.closest('tr').querySelector('.early-alert-grade-column');
        const gradeBadge = gradeColumn ? gradeColumn.querySelector('.badge') : null;
        const assigngrade = gradeBadge ? gradeBadge.innerHTML : 'No Grade';
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

            var student_id = checkbox.getAttribute('data-student-id');
            var student_idnumber = checkbox.getAttribute('data-student-idnumber');
            const studentCampusAttr = checkbox.getAttribute('data-student-campus');
            const studentFacultyAttr = checkbox.getAttribute('data-student-faculty');
            const studentMajorAttr = checkbox.getAttribute('data-student-major');
            const studentLangAttr = checkbox.getAttribute('data-student-lang');
            const courseIdAttr = checkbox.getAttribute('data-courseid');
            // uses data found in the checkbox element attributes to create a key to find the template
            var orgCourseDeptTemplateKey = 'org_course_' + studentMajorAttr + '_' + courseIdAttr + '_' + studentLangAttr + '_' + student_idnumber;
            var orgCourseFacTemplateKey = 'org_course_' + studentFacultyAttr + '_' + courseIdAttr + '_' + studentLangAttr + '_' + student_idnumber;
            var orgCourseCampusTemplateKey = 'org_course_' + studentCampusAttr + '_' + courseIdAttr + '_' + studentLangAttr + '_' + student_idnumber;
            var courseTemplateKey = 'course_' + courseIdAttr + '_' + studentLangAttr + '_' + student_idnumber;
            var campusTemplateKey = studentCampusAttr + '_' + studentLangAttr + '_' + student_idnumber;
            var facTemplateKey = studentCampusAttr + '_' + studentFacultyAttr + '_' + studentLangAttr + '_' + student_idnumber;
            var deptTemplateKey = studentCampusAttr + '_' + studentFacultyAttr + '_' + studentMajorAttr + '_' + studentLangAttr + '_' + student_idnumber;
            var templateEmailContent = '';
            var templateEmailSubject = '';

            // console.log('Course template key:', courseTemplateKey);
            // console.log('Campus template key:', campusTemplateKey);
            // console.log('Faculty template key:', facTemplateKey);
            // console.log('Department template key:', deptTemplateKey);
            //
            // console.log('New Template cache:', templateCache);

            // templateCache is checked for the template key and if found the email subject and content are set
            if (templateCache.has(orgCourseDeptTemplateKey)) {
                templateEmailSubject = templateCache.get(orgCourseDeptTemplateKey).subject;
                templateEmailContent = templateCache.get(orgCourseDeptTemplateKey).message;
                templateObj = templateCache.get(orgCourseDeptTemplateKey);
            } else if (templateCache.has(orgCourseFacTemplateKey)) {
                templateEmailSubject = templateCache.get(orgCourseFacTemplateKey).subject;
                templateEmailContent = templateCache.get(orgCourseFacTemplateKey).message;
                templateObj = templateCache.get(orgCourseFacTemplateKey);
            } else if (templateCache.has(orgCourseCampusTemplateKey)) {
                templateEmailSubject = templateCache.get(orgCourseCampusTemplateKey).subject;
                templateEmailContent = templateCache.get(orgCourseCampusTemplateKey).message;
                templateObj = templateCache.get(orgCourseCampusTemplateKey);
            } else if (templateCache.has(courseTemplateKey)) { // lastly check for course template
                //console.log("course cache found:", templateCache.get(courseTemplateKey));
                templateEmailSubject = templateCache.get(courseTemplateKey).subject;
                templateEmailContent = templateCache.get(courseTemplateKey).message;
                templateObj = templateCache.get(courseTemplateKey);
            } else if (templateCache.has(deptTemplateKey)) { // if faculty template not found, check department template
                // console.log("faculty cache found:", templateCache.get(deptTemplateKey));
                templateEmailSubject = templateCache.get(deptTemplateKey).subject;
                templateEmailContent = templateCache.get(deptTemplateKey).message;
                templateObj = templateCache.get(deptTemplateKey);
            } else if (templateCache.has(facTemplateKey)) { // if campus template not found, check faculty template
                templateEmailSubject = templateCache.get(facTemplateKey).subject;
                templateEmailContent = templateCache.get(facTemplateKey).message;
                templateObj = templateCache.get(facTemplateKey);
            } else if (templateCache.has(campusTemplateKey)) {
                // console.log("department cache found:", templateCache.get(campusTemplateKey));
                templateEmailSubject = templateCache.get(campusTemplateKey).subject;
                templateEmailContent = templateCache.get(campusTemplateKey).message;
                templateObj = templateCache.get(campusTemplateKey);
            } else { // if no templates are found, set default values
                templateEmailSubject = 'Template not found';
                templateEmailContent = 'Template not found';
            }

        } else {
            console.log("couldn't find checkbox");
        }

        var assignment_title = templateCache.get('assignment_title') || '';

        var params = {
            studentname: student_name_arr,
            assignmentgrade: assigngrade,
            assignmenttitle: assignment_title,
            coursename: templateCache.get('course_name'),
            customgrade: selected_grade ? selected_grade : 'D+',
            defaultgrade: "D+",
            custommessage: custom_message
        };

        // Apply the replacements
        var changedTemplateEmailContent = addUserInfo(templateEmailContent, params);

        // Double-check that [custommessage] is definitely replaced
        if (changedTemplateEmailContent.includes('[custommessage]')) {
            changedTemplateEmailContent = changedTemplateEmailContent.replace('[custommessage]', custom_message || '');
        }

        // assemble record data for individual buttons which includes student and template data
        record_data.student_id = student_id;
        record_data.student_name = student_name;
        record_data.course_name = templateCache.get('course_name');
        record_data.templateEmailSubject = templateEmailSubject;
        record_data.templateEmailContent = changedTemplateEmailContent;
        record_data.template_id = templateObj.templateid;
        record_data.revision_id = templateObj.revision_id;
        record_data.triggered_from_user_id = templateObj.triggered_from_user_id;
        record_data.target_user_id = student_id;
        record_data.course_id = templateObj.course_id;
        record_data.instructor_id = templateObj.instructor_id;
        record_data.assignment_name = params.assignmenttitle;
        record_data.actual_grade = assigngrade;
        record_data.trigger_grade = selected_grade_value;
        record_data.custom_message = custom_message;

        // case where previews are just added to grade alert type and missed exam etc
        if (alert_type !== 'assign') {
            button.addEventListener('click', function () {
                //console.log('Data sent to template from template cache:', record_data);
                setup_preview_buttons_from_template(record_data);
            });
        }
        // add record to student_template_cache_array to have data to submit / email
        student_template_cache_array.push(record_data);
    });

    // once we have all the data we can setup the emails to submit with the template cache data and student ids BUT we have to manage and select the users if they are checked/unchceked
    setup_send_emails(student_template_cache_array);
}

function setup_preview_emails_with_titles(templateCache) {
    // Get the early-alert-alert-type value
    const alert_type = document.getElementById('early-alert-alert-type').value;

    // Get the custom message from the template cache instead of directly from DOM
    const customMessage = templateCache.get('custom_message') || '';

    // store ALL the student data and template cache etc when its processed
    let student_template_cache_array = [];

    // Remove any existing click event listeners from preview buttons first
    const preview_buttons = document.querySelectorAll(".early-alert-preview-button");
    preview_buttons.forEach(button => {
        const clone = button.cloneNode(true);
        button.parentNode.replaceChild(clone, button);
    });

    // Now add new event listeners
    const fresh_buttons = document.querySelectorAll(".early-alert-preview-button");
    fresh_buttons.forEach(function (button) {
        let record_data = {};
        const checkbox = button.closest('tr').querySelector('.early-alert-student-checkbox');
        const gradeColumn = button.closest('tr').querySelector('.early-alert-grade-column');
        const gradeBadge = gradeColumn ? gradeColumn.querySelector('.badge') : null;
        const assigngrade = gradeBadge ? gradeBadge.innerHTML : 'No Grade';
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

            var student_id = checkbox.getAttribute('data-student-id');
            var student_idnumber = checkbox.getAttribute('data-student-idnumber');
            const studentCampusAttr = checkbox.getAttribute('data-student-campus');
            const studentFacultyAttr = checkbox.getAttribute('data-student-faculty');
            const studentMajorAttr = checkbox.getAttribute('data-student-major');
            const studentLangAttr = checkbox.getAttribute('data-student-lang');
            const courseIdAttr = checkbox.getAttribute('data-courseid');
            var orgCourseDeptTemplateKey = 'org_course_' + studentMajorAttr + '_' + courseIdAttr + '_' + studentLangAttr + '_' + student_idnumber;
            var orgCourseFacTemplateKey = 'org_course_' + studentFacultyAttr + '_' + courseIdAttr + '_' + studentLangAttr + '_' + student_idnumber;
            var orgCourseCampusTemplateKey = 'org_course_' + studentCampusAttr + '_' + courseIdAttr + '_' + studentLangAttr + '_' + student_idnumber;
            var courseTemplateKey = 'course_' + courseIdAttr + '_' + studentLangAttr + '_' + student_idnumber;
            var campusTemplateKey = studentCampusAttr + '_' + studentLangAttr + '_' + student_idnumber;
            var facTemplateKey = studentCampusAttr + '_' + studentFacultyAttr + '_' + studentLangAttr + '_' + student_idnumber;
            var deptTemplateKey = studentCampusAttr + '_' + studentFacultyAttr + '_' + studentMajorAttr+ '_' + studentLangAttr + '_' + student_idnumber;
            var templateEmailContent = '';
            var templateEmailSubject = '';

            // console.log('PET Course template key:', courseTemplateKey);
            // console.log('PET Campus template key:', campusTemplateKey);
            // console.log('PET Faculty template key:', facTemplateKey);
            // console.log('PET Department template key:', deptTemplateKey);

            if (templateCache.has(orgCourseDeptTemplateKey)) {
                templateEmailSubject = templateCache.get(orgCourseDeptTemplateKey).subject;
                templateEmailContent = templateCache.get(orgCourseDeptTemplateKey).message;
                templateObj = templateCache.get(orgCourseDeptTemplateKey);
            } else if (templateCache.has(orgCourseFacTemplateKey)) {
                templateEmailSubject = templateCache.get(orgCourseFacTemplateKey).subject;
                templateEmailContent = templateCache.get(orgCourseFacTemplateKey).message;
                templateObj = templateCache.get(orgCourseFacTemplateKey);
            } else if (templateCache.has(orgCourseCampusTemplateKey)) {
                templateEmailSubject = templateCache.get(orgCourseCampusTemplateKey).subject;
                templateEmailContent = templateCache.get(orgCourseCampusTemplateKey).message;
                templateObj = templateCache.get(orgCourseCampusTemplateKey);
            } else if (templateCache.has(courseTemplateKey)) {
                //console.log("course cache found:", templateCache.get(courseTemplateKey));
                templateEmailSubject = templateCache.get(courseTemplateKey).subject;
                templateEmailContent = templateCache.get(courseTemplateKey).message;
                templateObj = templateCache.get(courseTemplateKey);
            } else if (templateCache.has(deptTemplateKey)) {
                // console.log("faculty cache found:", templateCache.get(deptTemplateKey));
                templateEmailSubject = templateCache.get(deptTemplateKey).subject;
                templateEmailContent = templateCache.get(deptTemplateKey).message;
                templateObj = templateCache.get(deptTemplateKey);
            } else if (templateCache.has(facTemplateKey)) {
                templateEmailSubject = templateCache.get(facTemplateKey).subject;
                templateEmailContent = templateCache.get(facTemplateKey).message;
                templateObj = templateCache.get(facTemplateKey);
            } else if (templateCache.has(campusTemplateKey)) {
                // console.log("department cache found:", templateCache.get(campusTemplateKey));
                templateEmailSubject = templateCache.get(campusTemplateKey).subject;
                templateEmailContent = templateCache.get(campusTemplateKey).message;
                templateObj = templateCache.get(campusTemplateKey);
            } else {
                templateEmailSubject = 'Template not found';
                templateEmailContent = 'Template not found';
            }
        }

        var assignment_title = templateCache.get('assignment_title') || '';

        var params = {
            studentname: student_name_arr,
            assignmentgrade: assigngrade,
            assignmenttitle: assignment_title,
            coursename: templateCache.get('course_name'),
            customgrade: selected_grade ? selected_grade : 'D+',
            defaultgrade: "D+",
            custommessage: customMessage
        };

        // Apply the replacements
        var changedTemplateEmailContent = addUserInfo(templateEmailContent, params);

        // Double-check that [custommessage] is definitely replaced
        if (changedTemplateEmailContent.includes('[custommessage]')) {
            changedTemplateEmailContent = changedTemplateEmailContent.replace('[custommessage]', customMessage || '');
        }

        // assemble record data for individual buttons which includes student and template data
        record_data.student_id = student_id;
        record_data.student_name = student_name;
        record_data.course_name = templateCache.get('course_name');
        record_data.templateEmailSubject = templateEmailSubject;
        record_data.templateEmailContent = changedTemplateEmailContent;
        record_data.template_id = templateObj.templateid;
        record_data.revision_id = templateObj.revision_id;
        record_data.triggered_from_user_id = templateObj.triggered_from_user_id;
        record_data.target_user_id = student_id;
        record_data.course_id = templateObj.course_id;
        record_data.instructor_id = templateObj.instructor_id;
        record_data.assignment_name = params.assignmenttitle;
        record_data.actual_grade = assigngrade;
        record_data.trigger_grade = selected_grade_value;
        record_data.custom_message = customMessage;

        button.addEventListener('click', function () {
            setup_preview_buttons_from_template(record_data);
        });
        student_template_cache_array.push(record_data);
    });

    setup_send_emails(student_template_cache_array);
}

var current_modal = null;

function setup_preview_buttons_from_template(student_template_data) {
    //console.log('Modal created with: ',student_template_data);
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
        return current_modal;
    });

}

function setup_send_emails(student_template_cache_array) {
    const send_button = document.getElementById('early-alert-send-button1');
    const send_button2 = document.getElementById('early-alert-send-button2');

    // Remove any existing event listeners by cloning the buttons
    if (send_button) {
        const new_send_button = send_button.cloneNode(true);
        send_button.parentNode.replaceChild(new_send_button, send_button);
        new_send_button.addEventListener('click', function () {
            // Always rebuild the array based on currently checked students
            maintain_student_template_data_for_submit(student_template_cache_array, true);
        });
    }

    if (send_button2) {
        const new_send_button2 = send_button2.cloneNode(true);
        send_button2.parentNode.replaceChild(new_send_button2, send_button2);
        new_send_button2.addEventListener('click', function () {
            // Always rebuild the array based on currently checked students
            maintain_student_template_data_for_submit(student_template_cache_array, true);
        });
    }
}

// Only send for currently checked students, not all in the cache array
function maintain_student_template_data_for_submit(student_template_cache_array, forceRebuild = false) {
    check_individual_students_checkboxes_for_submit();
    var student_ids_array = JSON.parse(document.getElementById("early-alert-student-ids").value); // hidden field ids

    // If forceRebuild is true, rebuild the array from DOM state
    let filtered_array = [];
    if (forceRebuild) {
        // Rebuild from DOM: only include checked students
        const student_checkboxes = document.querySelectorAll("input[class^='early-alert-student-checkbox']");
        student_checkboxes.forEach(function (checkbox) {
            if (checkbox.checked) {
                const student_id = checkbox.getAttribute('data-student-id');
                // Find the matching record in the cache array
                const record = student_template_cache_array.find(stu => stu.student_id == student_id);
                if (record) filtered_array.push(record);
            }
        });
    } else {
        // remove students from template cache if they have been unchecked
        filtered_array = student_template_cache_array.filter(student => student_ids_array.includes(student.student_id));
    }

    filtered_array.length > 0 ? create_notification_dialog(filtered_array) : notification.alert('No students selected', 'Please select at least one student to send emails.');
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
    const params = new URLSearchParams(window.location.search);
    let user_id = params.get('user_id');
    // If user_id is not in URL, use the hidden input value (logged-in user)
    if (!user_id) {
        const teacherUserIdInput = document.getElementById('early-alert-teacher-user-id');
        if (teacherUserIdInput) {
            user_id = teacherUserIdInput.value;
        }
    }
    selectBox.init('#search', 'earlyalert_get_users', "Select a user");
    selectCourseBox.init('#course-search', 'earlyalert_get_courses', user_id, "Select a course");
    let search = document.getElementById('search');
    let courseSearch = document.getElementById('course-search');
    let userId = search ? search.value : user_id; // fallback to logged-in user

    // On course change, reload page with user_id and course_id
    courseSearch.addEventListener('change', function (event) {
        const courseId = courseSearch.value;
        if (courseId) {
            window.location.href = config.wwwroot + '/local/earlyalert/dashboard.php?user_id=' + user_id + '&course_id=' + courseId;
        }
    });
    // If a user is already selected, populate courses for that user
    if (search && courseSearch) {
        // On user change, update courses and clear selection
        search.addEventListener('change', function (event) {
            const newUserId = search.value;
            selectCourseBox.init('#course-search', 'earlyalert_get_courses', newUserId, "Select a course");
            // Clear the course selection
            courseSearch.value = '';
        });
    }

    // Set the selected value on courseSearch if course_id is present in URL
    const course_id = params.get('course_id');
    if (course_id && courseSearch) {
        // Wait for the dropdown to be populated, then set the value
        const setSelectedCourse = () => {
            if (courseSearch.options.length > 1) {
                courseSearch.value = course_id;
            } else {
                setTimeout(setSelectedCourse, 50);
            }
        };
        setSelectedCourse();
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
        '[assignmenttitle]',
        '[custommessage]'
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
                case 6:
                    // custommessage action
                    let customMessageText = params.custommessage || '';
                    uniqueMatches[i] = customMessageText;
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

/**
 * Focuses on the check all/none checkbox when the student list is rendered
 */
function focusOnCheckall() {
    // Use setTimeout to ensure DOM is fully rendered
    setTimeout(() => {
        // Find the check all/none checkbox
        const check_all_none_checkbox = document.getElementById('early-alert-checkall-student-checkbox');

        if (check_all_none_checkbox) {
            // Scroll to the check all checkbox smoothly
            check_all_none_checkbox.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });

            // Focus on the checkbox for keyboard navigation
            check_all_none_checkbox.focus();
        }
    }, 100); // Small delay to ensure DOM is ready
}

/**
 * Sets up toggle functionality for the single custom message container
 */
function setup_custom_message_toggles() {
    const btn = document.getElementById('toggle-custom-message');
    const container = document.getElementById('custom-message-container');

    if (!btn || !container) {
        return;
    }

    // Replace button to clear any previous listeners from re-renders
    const button = btn.cloneNode(true);
    btn.parentNode.replaceChild(button, btn);

    const setOpenState = (open) => {
        // Sync aria state
        button.setAttribute('aria-expanded', String(open));
        // Update label and styles
        if (open) {
            button.innerHTML = '<i class="fa fa-minus"></i> Hide Custom Message';
            button.classList.remove('btn-outline-secondary');
            button.classList.add('btn-outline-primary');
        } else {
            button.innerHTML = '<i class="fa fa-plus"></i> Show Custom Message';
            button.classList.remove('btn-outline-primary');
            button.classList.add('btn-outline-secondary');
        }
    };

    // Ensure base collapse class exists
    if (!container.classList.contains('collapse')) {
        container.classList.add('collapse');
    }

    // Initialize UI based on current state
    setOpenState(container.classList.contains('show'));

    // Handle click without relying on Bootstrap jQuery events
    button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const willOpen = !container.classList.contains('show');
        container.classList.toggle('show', willOpen);
        setOpenState(willOpen);
        if (willOpen) {
            // Focus textarea when opening
            setTimeout(() => {
                const ta = container.querySelector('.early-alert-custom-message');
                if (ta) ta.focus();
            }, 0);
        }
    });

    // Hover effects
    button.addEventListener('mouseenter', () => {
        if (container.classList.contains('show')) {
            button.classList.add('btn-primary');
            button.classList.remove('btn-outline-primary');
        } else {
            button.classList.add('btn-secondary');
            button.classList.remove('btn-outline-secondary');
        }
    });
    button.addEventListener('mouseleave', () => {
        if (container.classList.contains('show')) {
            button.classList.remove('btn-primary');
            button.classList.add('btn-outline-primary');
        } else {
            button.classList.remove('btn-secondary');
            button.classList.add('btn-outline-secondary');
        }
    });
}
