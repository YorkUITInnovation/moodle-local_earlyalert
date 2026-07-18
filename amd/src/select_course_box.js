import ajax from 'core/ajax';

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
        ajax.call([{
            methodname: method,
            args: { userid: userid }
        }])[0].then(function(courses) {
            if (Array.isArray(courses)) {
                courses.forEach(course => {
                    const option = document.createElement('option');
                    option.value = course.id;
                    option.textContent = course.fullname;
                    select.appendChild(option);
                });
            }
        }).catch(function() {
        });
    }
};

export default selectCourseBox;

