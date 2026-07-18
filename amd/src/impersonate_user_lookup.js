import * as FormAutocomplete from 'core/form-autocomplete';
import {disableAllChecks} from 'core_form/changechecker';

/**
 * Initialize the send-on-behalf-of user autocomplete.
 *
 * @returns {void}
 */
export const init = () => {
    const userselect = document.getElementById('search');
    if (!userselect || userselect.dataset.eaAutocompleteInit === '1') {
        return;
    }

    userselect.dataset.eaAutocompleteInit = '1';

    const placeholder = userselect.dataset.placeholder || '';
    const request = FormAutocomplete.enhance(
        `#${userselect.id}`,
        false,
        'local_earlyalert/student_lookup_autocomplete',
        placeholder,
        false,
        true
    );

    if (request && typeof request.fail === 'function') {
        request.fail(() => {
            // Keep page usable if autocomplete enhancement fails.
        });
    }

    userselect.addEventListener('change', () => {
        const selecteduserid = parseInt(userselect.value || '0', 10);
        if (!selecteduserid) {
            return;
        }

        disableAllChecks();

        const url = new URL(window.location.href);
        url.searchParams.set('user_id', String(selecteduserid));
        url.searchParams.delete('course_id');
        window.location.href = url.toString();
    });

    initCourseListRedirect();
};

/**
 * Redirect when selecting a course in impersonation Course List.
 *
 * @returns {void}
 */
const initCourseListRedirect = () => {
    const courseselect = document.getElementById('course-search');
    const userselect = document.getElementById('search');
    if (!courseselect || !userselect) {
        return;
    }

    courseselect.addEventListener('change', () => {
        const courseid = parseInt(courseselect.value || '0', 10);
        const userid = parseInt(userselect.value || '0', 10);

        disableAllChecks();

        const url = new URL(window.location.href);
        if (userid) {
            url.searchParams.set('user_id', String(userid));
        }

        if (courseid) {
            url.searchParams.set('course_id', String(courseid));
        } else {
            url.searchParams.delete('course_id');
        }

        window.location.href = url.toString();
    });
};

