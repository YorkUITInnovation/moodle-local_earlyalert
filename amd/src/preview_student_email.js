
import ModalFactory from 'core/modal_factory';
import {get_string as getString} from 'core/str';
import Templates from 'core/templates';
import ajax from 'core/ajax';
/**
 * Modal for email template preview
 */
export const init = async () => {

    ModalFactory.create({
        title: getString('preview_email', 'local_earlyalert'),
        type: ModalFactory.types.CANCEL,
        body: Templates.render('local_earlyalert/preview_student_email', {name: 'etemplate name', student_name: 'Peter Parker', subject: 'Math 101' , message: '<p> Please contact Student Admissions to further discuss </p><p>It has been brought to our attention...</p> ', instructor_name: 'Mr. White'})
    }).then(modal => {
        const preview_button = document.getElementById('id_early_alert_filter_preview_button');
        if (preview_button) {
            preview_button.addEventListener('click', function() {
                modal.show();
            });
        }
    });
};

