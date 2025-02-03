import ajax from 'core/ajax';
import Templates from 'core/templates';
import ModalFactory from 'core/modal_factory';
import {get_string as getString} from 'core/str';
import {add as addToast} from 'core/toast';

export const init = () => {
    update_student_status_for_advisor();
    update_student_status_for_instructor();
    preview_message();
};

function update_student_status_for_instructor() {

    // Select all checkboxes with the class .checkbox-instructor-followup
    const checkboxes = document.querySelectorAll('.checkbox-instructor-followup');

    // Loop through each checkbox and add an event listener
    checkboxes.forEach(function (checkbox) {
        checkbox.addEventListener('change', function () {
            const logId = this.getAttribute('data-logid');
            const status = this.checked ? 1 : 0;

            ajax.call([{
                methodname: 'earlyalert_update_student_status_instructor',
                args: {
                    logid: logId,
                    status: status
                }
            }])[0].then(function (response) {
                // Show Toast notification
                addToast(getString('advised_success_toast', 'local_earlyalert'), {
                    delay: 10000,
                    closeButton: true,
                });
            }).catch(function (error) {
                console.error('Failed to update student status:', error);
                addToast(getString('advised_failed_toast', 'local_earlyalert'), {
                    delay: 10000,
                    closeButton: true,
                });
            });
        });
    });
}

function update_student_status_for_advisor() {
    // Select all checkboxes with the class .checkbox-advisor-followup
    const checkboxes = document.querySelectorAll('.checkbox-advisor-followup');

// Loop through each checkbox and add an event listener
    checkboxes.forEach(function (checkbox) {
        checkbox.addEventListener('change', function () {
            const logId = this.getAttribute('data-logid');
            // Check if this checkbox is checked
            const status = this.checked ? 1 : 0;
            // Perform the AJAX call for the checkbox that was changed
            ajax.call([{
                methodname: 'earlyalert_update_student_status_advisor',
                args: {
                    logid: logId,
                    status: status
                }
            }])[0].then(function (response) {
                // Show Toast notification
                addToast(getString('advised_success_toast', 'local_earlyalert'), {
                    delay: 10000,
                    closeButton: true,
                });
            }).catch(function (error) {
                console.error('Failed to update student status:', error);
                addToast(getString('advised_failed_toast', 'local_earlyalert'), {
                    delay: 10000,
                    closeButton: true,
                });
            });
        });
    });
}

function preview_message() {
    const previewButtons = document.querySelectorAll('.btn-early-alert-preview-message');

    previewButtons.forEach(function (previewButton) {
        previewButton.addEventListener('click', function () {
            const logId = this.getAttribute('data-logid');
            ajax.call([{
                methodname: 'earlyalert_get_message',
                args: {
                    logid: logId
                }
            }])[0].then(function (response) {
                ModalFactory.create({
                    title: getString('preview_email', 'local_earlyalert'),
                    type: ModalFactory.types.CANCEL,
                    body: Templates.render('local_earlyalert/preview_student_email', response),
                    large: true,
                }).then(modal => {
                    modal.show();
                });
            }).catch(function (error) {
                console.error('Failed to preview message:', error);
            });
        });
    });
}

