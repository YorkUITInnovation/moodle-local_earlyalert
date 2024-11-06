
import ModalFactory from 'core/modal_factory';
import {get_string as getString} from 'core/str';
import Templates from 'core/templates';

export const init = () => {
    preview_student_email();
};

/**
 * Create js modal
 */
function preview_student_email() {
    ModalFactory.create({
        title: getString('preview_email', 'local_earlyalert'),
        body: Templates.render('/local/earlyalert/templates/preview_student_email', {}),
        removeOnClose: true,
    })
        .then(modal => {
            modal.show();
            return modal;
        });

}