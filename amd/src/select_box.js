// File: amd/src/select_box.js
import ajax from 'core/ajax';

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
            select.innerHTML = ''; // Clear existing options
            // add <option value="">Select a user</option> to the selectElement
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

        if (selectElement.hasAttribute('multiple')) {
            selectElement.addEventListener('change', function () {
                const selectedOptions = Array.from(selectElement.selectedOptions).map(opt => opt.value);
            });
        }
    }
};

export default selectBox;