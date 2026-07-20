// File: amd/src/select_box.js
import ajax from 'core/ajax';
import {get_string as getString} from 'core/str';

const selectBox = {
    init: function(selector, method, placeholder) {
        const selectElement = document.querySelector(selector);
        if (!selectElement) return;

        if (selectElement.dataset.selectBoxInitialised === 'true') {
            return;
        }
        selectElement.dataset.selectBoxInitialised = 'true';

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = placeholder;
        searchInput.autocomplete = 'off';

        // Add class form-control to the search input
        searchInput.classList.add('form-control');
        searchInput.style.display = 'none'; // Initially hide the search input
        selectElement.parentNode.insertBefore(searchInput, selectElement.nextSibling);

        // add <option value="">Select a user</option> to the selectElement
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = placeholder;
        selectElement.innerHTML = '';
        selectElement.appendChild(opt);

        const revealSearchInput = function() {
            if (searchInput.style.display !== 'block') {
                searchInput.style.display = 'block';
            }
            searchInput.focus();
        };

        selectElement.addEventListener('mousedown', function(event) {
            if (searchInput.style.display === 'none') {
                event.preventDefault();
                revealSearchInput();
            }
        });

        selectElement.addEventListener('focus', function() {
            revealSearchInput();
        });

        selectElement.addEventListener('click', function() {
            revealSearchInput();
        });

        selectElement.addEventListener('keydown', function(event) {
            if (searchInput.style.display === 'none' && ['Enter', ' ', 'ArrowDown'].includes(event.key)) {
                event.preventDefault();
                revealSearchInput();
            }
        });

        searchInput.addEventListener('input', function() {
            const searchTerm = (searchInput.value || '').trim();
            if (searchTerm.length < 3) return; // Minimum 3 characters to search

            ajax.call([{
                methodname: method,
                args: {search: searchTerm},
                done: function(response) {
                    updateOptions(selectElement, response);
                },
                fail: function(error) {
                    console.error(error);
                }
            }]);
        });

        function updateOptions(select, options) {
            if (select.hasAttribute('multiple')) {
                if (select.selectedOptions.length === 0) {
                    select.innerHTML = '';
                }
            } else {
                select.innerHTML = '';
                select.appendChild(opt);
            }

            // Open the options list
            select.size = Math.max(options.length + 1, 1);

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
                getString('impersonate_user', 'local_earlyalert', selectedText).then(function(labelText) {
                    label.textContent = labelText;
                    console.log('resolved label text:', labelText);
                });
            }
        }

        if (selectElement.hasAttribute('multiple')) {
            selectElement.addEventListener('change', function() {
                // updateLabelWithSelectedOption();
            });
        } else {
            // Add change event for single select to reload page with user_id
            selectElement.addEventListener('change', function() {
                const selectedUserId = selectElement.value;
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
