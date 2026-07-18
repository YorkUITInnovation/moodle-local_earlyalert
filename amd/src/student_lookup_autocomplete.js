import * as Ajax from 'core/ajax';

/**
 * Fetches user options from the student lookup webservice.
 *
 * @param {string} selector
 * @param {string} query
 * @param {Function} success
 * @param {Function} failure
 */
export const transport = (selector, query, success, failure) => {
    Ajax.call([{
        methodname: 'local_earlyalert_get_users',
        args: {
            search: query || '',
        },
    }])[0].then(success).catch(failure);
};

/**
 * Pass through server results to core/form-autocomplete.
 *
 * @param {string} selector
 * @param {Array} results
 * @returns {Array}
 */
export const processResults = (selector, results) => results || [];

