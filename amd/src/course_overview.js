import ajax from 'core/ajax';
import Templates from 'core/templates';
import {get_string as getString} from 'core/str';

export const init = () => {
    observeCourseOverviewButtons();
};

// add mutation observer that lets us know when the course overview buttons are added to the page
function observeCourseOverviewButtons() {
    const targetNode = document.getElementById('early-alert-student-results');
    const config = { childList: true, subtree: true };

    const callback = function(mutationsList, observer) {
        for (let mutation of mutationsList) {
            if (mutation.type === 'childList') {
                addCourseOverviewButtonListener();
            }
        }
    };

    const observer = new MutationObserver(callback);
    observer.observe(targetNode, config);

    // Initial call to add listeners to existing buttons
    addCourseOverviewButtonListener();
}

function addCourseOverviewButtonListener() {
    // find all buttons with class btn-course-overview
    // Get the course id from the button data-course-id attribute
    // Call the ajax function with the course id
    // Display the students in the course
    const courseOverviewButtons = document.querySelectorAll('.btn-course-overview');
    courseOverviewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const courseId = this.getAttribute('data-course_id');
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

            // Make ajax call to get the students in the course
            ajax.call([{
                methodname: 'earlyalert_course_overview',
                args: {
                    id: courseId
                }
            }])[0].then(function (response) {
                console.log(response);
                // Hide loader
                // Render the course overview template
                Templates.render('local_earlyalert/course_overview', response)
                    .then(function (html, js) {
                        // Insert the rendered template into the target element
                        document.getElementById('early-alert-student-results').innerHTML = html;
                        Templates.runTemplateJS(js);
                    })
                    .catch(function (error) {
                        console.error('Failed to render template:', error);
                    });
            }).catch(function (error) {
                console.error('Failed to get course students:', error);
            });
        });
    });
}