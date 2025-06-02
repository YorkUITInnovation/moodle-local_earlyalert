// File: amd/src/select_box.js
import ajax from 'core/ajax';
import {get_string as getString} from 'core/str';

const selectBox = {
    init: function(selector, method, placeholder) {
        const selectElement = document.querySelector(selector);
        if (!selectElement) return;

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = placeholder;
        // Add some margin-bottom to the select element
        selectElement.style.marginBottom = '10px';
        // Add class form-control to the search input
        searchInput.classList.add('form-control');
        searchInput.style.display = 'none'; // Initially hide the search input
        selectElement.parentNode.insertBefore(searchInput, selectElement.nextSibling);

        selectElement.addEventListener('click', function () {
            searchInput.style.display = 'block'; // Show the search input when the select element is clicked
            // Focus the search input
            searchInput.focus();
        });
        // add <option value="">Select a user</option> to the selectElement
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = placeholder;
        searchInput.addEventListener('input', function () {
            const searchTerm = searchInput.value;
            if (searchTerm.length < 3) return; // Minimum 3 characters to search

            ajax.call([{
                methodname: method,
                args: {search: searchTerm},
                done: function (response) {
                    updateOptions(selectElement, response);
                },
                fail: function (error) {
                    console.error(error);
                }
            }]);
        });

        function updateOptions(select, options) {
            // If multiple attribute is set, and a or multiple options are selected, do not clear the options
            if (select.hasAttribute('multiple')) {
                // Are options slected?
                if (select.selectedOptions.length > 0) {
                    // do nothing
                } else {
                    select.innerHTML = '';
                }
            } else {
                select.innerHTML = 'test';
                select.appendChild(opt);
            }

            select.appendChild(opt);
            // Open the options list
            select.size = options.length + 2;

            options.forEach(option => {

                const opt = document.createElement('option');
                opt.value = option.value;
                opt.textContent = option.label;
                select.appendChild(opt);
            });
        }

        // Helper: update label with selected option
        function updateLabelWithSelectedOption() {
            const label = selectElement.labels[0];
            if (label && selectElement.selectedIndex > 0) {
                const selectedText = selectElement.options[selectElement.selectedIndex].textContent;
                getString('impersonate_user', 'local_earlyalert', selectedText).then(function(labelText) { // Use getString to translate the label text and resolve it
                    label.textContent = labelText;
                    console.log('resolved label text:', labelText);
                });
            }
        }

        if (selectElement.hasAttribute('multiple')) {
            selectElement.addEventListener('change', function () {
                const selectedOptions = Array.from(selectElement.selectedOptions).map(opt => opt.value);
                // updateLabelWithSelectedOption();
            });
        } else {
            // Add change event for single select to reload page with user_id
            selectElement.addEventListener('change', function () {
                const selectedUserId = selectElement.value;
                //updateLabelWithSelectedOption();
                if (selectedUserId) {
                    // Reload the page with user_id as a query parameter
                    const url = new URL(window.location.href);
                    url.searchParams.set('user_id', selectedUserId);
                    // Remove course_id if present, so course list refreshes
                    url.searchParams.delete('course_id');
                    window.location.href = url.toString();
                }
            });
        }

        // On page load, update label if a user is already selected
        updateLabelWithSelectedOption();
    }
};

export default selectBox;

