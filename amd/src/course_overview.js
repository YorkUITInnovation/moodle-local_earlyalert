import ajax from 'core/ajax';
import Templates from 'core/templates';
import {get_string as getString} from 'core/str';

export const init = () => {
    get_course_overview_students();

};

function get_course_overview_students() {
    // When button with class btn-course-overview is clicked
    // Get the course id from the button data-course-id attribute
    // Call the ajax function with the course id
    // Display the students in the course
    document.querySelector('.btn-course-overview').addEventListener('click', function() {
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

}