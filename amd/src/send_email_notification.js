import notification from 'core/notification';
import ajax from 'core/ajax';
import {get_string as getString} from 'core/str';

export const init = () => {
    sendEmails();
};

/**
 * Send email
 */
function sendEmails() {
    // Get button by class early-alert-send-button

    document.querySelectorAll('.early-alert-send-button').forEach(button => {
        button.addEventListener('click', function () {
            // Get value from element with id early_alert_filter_course_id
            var course_id = document.getElementById('early_alert_filter_course_id').value;
            var alert_type = document.getElementById('early-alert-alert-type').value;
            var course_name = document.getElementById('early_alert_course_name').value;

            // Get all checked checkboxes fromelement with class early_alert_course_name and add to array called ids
            var ids = [];
            document.querySelectorAll('.early_alert_course_name').forEach(checkbox => {
                if (checkbox.checked) {
                    ids.push(checkbox.value);
                }
            });

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
                    methodname: 'earlyalert_report_log_insert',
                    args: {
                        id: ids,
                    }
                }]);
                sendEmail[0].done(function () {
                    // success
                    notification.alert(sent_email);
                }).fail(function () {
                    notification.alert(could_not_send_email);
                    //notification.alert(sent_dialog_text);
                });
            });
        });
    });

}