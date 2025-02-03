import ajax from 'core/ajax';
import Templates from 'core/templates';
import ModalFactory from 'core/modal_factory';
import ModalEvents from 'core/modal_events';
import {get_string as getString} from 'core/str';
import notification from 'core/notification';
import {get_format as formatString} from 'core/str';
import selectBox from 'local_earlyalert/select_box';
import config from 'core/config';

export const init = () => {
    get_users();
};

function get_users() {
    selectBox.init('#earlyalert-student-search', 'earlyalert_get_users', "Select a user");
    // On search change, navigate to a url with the user_id as a parameter
    let search = document.getElementById('earlyalert-student-search');
    if (search) {
        document.getElementById('earlyalert-student-search').addEventListener('change', function (event) {
            //console.log(search.value);
            window.location.href = config.wwwroot + '/local/earlyalert/student_lookup.php?user_id=' + search.value;
        });
    }
}