import ajax from 'core/ajax';
import Templates from 'core/templates';
import {get_string as getString} from 'core/str';

export const init = () => {
    update_student_status_for_advisor();
    update_student_status_for_instructor();
};

function update_student_status_for_instructor() {

    // Select all checkboxes with the class .checkbox-instructor-followup
    const checkboxes = document.querySelectorAll('.checkbox-instructor-followup');

    // Loop through each checkbox and add an event listener
    checkboxes.forEach(function(checkbox) {
        checkbox.addEventListener('change', function() {
            const logId = this.getAttribute('data-logid');
            const status = this.checked ? 1 : 0;

            ajax.call([{
                methodname: 'earlyalert_update_student_status_instructor',
                args: {
                    logid: logId,
                    status: status
                }
            }])[0].then(function (response) {
                console.log(response);
            }).catch(function (error) {
                console.error('Failed to update student status:', error);
            });
        });
    });
}

function update_student_status_for_advisor() {
    // Select all checkboxes with the class .checkbox-advisor-followup
    const checkboxes = document.querySelectorAll('.checkbox-advisor-followup');

    // Loop through each checkbox and add an event listener
    checkboxes.forEach(function(checkbox) {
        checkbox.addEventListener('change', function() {
            const logId = this.getAttribute('data-logid');
            const status = this.checked ? 1 : 0;

            ajax.call([{
                methodname: 'earlyalert_update_student_status_advisor',
                args: {
                    logid: logId,
                    status: status
                }
            }])[0].then(function (response) {
                console.log(response);
            }).catch(function (error) {
                console.error('Failed to update student status:', error);
            });
        });
    });
}