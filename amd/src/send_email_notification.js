import notification from 'core/notification';
import ajax from 'core/ajax';
import {get_string as getString} from 'core/str';

export const init = () => {
    //sendEmails();
};

/**
 * Delete advisor
 */
function sendEmails() {
    // Pop-up notification when .btn-local-organization-delete-advisor is clicked
    const send_button = document.getElementById('id_early_alert_filter_save_button');
    send_button.addEventListener('click', function () {
            // Get the data id attribute value
            var ids = this.getAttribute('data-id'); // hidden field ids
            var send_string = getString('send_email', 'local_earlyalert');
            var send_dialog_text = getString('send_dialog_text', 'local_earlyalert');
            var send = getString('send', 'local_earlyalert');
            var cancel = getString('cancel', 'local_earlyalert');
            var sent_email = getString('sent_email', 'local_earlyalert');
            var could_not_send_email = getString('could_not_send_email', 'local_earlyalert');
            // Notification
            notification.confirm(send_string, send_dialog_text, send, cancel, function () {
                // Delete the record
                var sendEmail = ajax.call([{
                    methodname: 'local_earlyalert_sendEmail',
                    args: {
                        id: ids,
                    }
                }]);
                sendEmail[0].done(function () {
                    // success
                    notification.alert(sent_email);
                }).fail(function () {
                    notification.alert(could_not_send_email);
                });
            });
    });

}