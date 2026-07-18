import config from 'core/config';
import {disableAllChecks} from 'core_form/changechecker';

export const init = () => {
    initStudentLookupRedirect();
};

function initStudentLookupRedirect() {
    const search = document.getElementById('earlyalert-student-search');
    if (search) {
        search.addEventListener('change', () => {
            const selecteduserid = parseInt(search.value || '0', 10);
            if (!selecteduserid) {
                return;
            }
            disableAllChecks();
            window.location.href = `${config.wwwroot}/local/earlyalert/student_lookup.php?user_id=${selecteduserid}`;
        });
    }
}