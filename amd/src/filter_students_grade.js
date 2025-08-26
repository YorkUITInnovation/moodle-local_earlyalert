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
            // console.log('teacher_user_id:', teacher_user_id);
            // Get student list based on alert type
            setup_filter_students_by_grade(course_id, 9, course_name, alert_type, teacher_user_id);
        }
    });
}


/**
 * Adds students with grades
 */

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
        const assignmentPreview = document.getElementById('assignment-title-preview');
        if (assignmentPreview) {
            assignmentPreview.textContent = title ? `: "${title.substring(0, 50)}${title.length > 50 ? '...' : ''}"` : '';
        }

        // Validate the assignment title
        validateAssignmentTitle(title);
    });

    // Only update the full preview on focus out to reduce processing
    assignment_input.addEventListener('focusout', function(evt) {
        var assignment_title = assignment_input.value.trim();

        // Validate the assignment title
        if (validateAssignmentTitle(assignment_title)) {
            setup_filter_students_by_grade(course_id, '9', course_name, alert_type, teacher_user_id, assignment_title);
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

        var finalCache = new Map();

        // Fetch student list and templates
        var get_grades_and_templates = ajax.call([
            {methodname: 'earlyalert_course_grades_percent_get', args: {"id": course_id, "grade_letter_id": grade_letter_id, "teacher_user_id": teacher_user_id}},
            {methodname: 'earlyalert_course_student_templates', args: {"teacher_user_id": teacher_user_id, "id": course_id, "alert_type": alert_type}}
        ]);
        Promise.all(get_grades_and_templates)
            .then(([grades_response, templates_response]) => {
                // console.log('grade response1: ' , grades_response);
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
                            grade_select.value = grade_letter_id;
                            // setup listener for filtering students by grade drop down
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

