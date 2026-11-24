import ajax from 'core/ajax';
import {get_string as getString} from 'core/str';

const selectCourseBox = {
    init: function(selector, method, userid, placeholder) {
        const select = document.querySelector(selector);
        if (!select) {
            return;
        }
        select.innerHTML = `<option value="">${placeholder}</option>`;
        if (!userid) {
            return;
        }
        select.disabled = true;
        getString('loading_courses', 'local_earlyalert').then(text => {
            if (select.options.length === 1 && select.disabled) {
                select.options[0].textContent = text;
            }
            return text;
        }).catch(() => {});
        ajax.call([{
            methodname: method,
            args: { userid: userid }
        }])[0].then(function(courses) {
            select.options[0].textContent = placeholder;
            select.disabled = false;
            if (Array.isArray(courses)) {
                courses.forEach(course => {
                    const option = document.createElement('option');
                    option.value = course.id;
                    option.textContent = course.fullname;
                    select.appendChild(option);
                });
            }
        }).catch(function() {
            select.options[0].textContent = placeholder;
            select.disabled = false;
        });
    }
};

export default selectCourseBox;

