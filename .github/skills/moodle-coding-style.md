# Moodle 5.1 Coding Style Guide for GitHub Copilot

This document defines the coding standards used in the Moodle 5.1 codebase. Follow these conventions precisely when generating or suggesting code for this project.

---

## PHP Coding Style

### File Structure

Every PHP file must begin with the GPL license boilerplate comment block, followed by a PHPDoc `@package` block:

```php
<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Short description of this file.
 *
 * @package    mod_example
 * @copyright  2025 Your Name <you@example.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
```

### PHP Version & Strict Types

- Target **PHP 8.2+** (as declared in `phpcs.xml.dist`).
- Use `declare(strict_types=1);` at the top of modern class files (after the opening `<?php`).

```php
<?php
// ... license header ...

declare(strict_types=1);

namespace mod_example;
```

### MOODLE_INTERNAL Guard

Library files that are not entry points must include the internal guard:

```php
defined('MOODLE_INTERNAL') || die();
```

This guard is **not** required in files under `classes/` that use namespaces and are autoloaded.

### Namespaces

- Namespaces follow the pattern `plugintype_pluginname` (e.g., `mod_forum`, `core_user`).
- Sub-namespaces use backslashes: `mod_forum\local\factories`.
- Class files live under `classes/` and are autoloaded by Moodle.

```php
namespace mod_example;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_value;
```

### Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Classes (namespaced) | `snake_case` | `class dates_manager` |
| Classes (legacy, non-namespaced) | `plugintype_pluginname_classname` | `class mod_forum_observer` |
| Methods | `snake_case` | `public function get_dates()` |
| Variables | `snake_case` | `$course_id`, `$user_record` |
| Constants | `UPPER_SNAKE_CASE` | `const FORUM_DISCUSSION_UNSUBSCRIBED = -1;` |
| Database table references | `{tablename}` (no prefix) | `{forum}`, `{forum_subscriptions}` |

### PHPDoc Blocks

All classes, methods, properties, and constants must have PHPDoc comments:

```php
/**
 * Short description of the class.
 *
 * @copyright  2025 Your Name <you@example.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class example_class {

    /**
     * A description of this constant.
     *
     * @var int
     */
    const SOME_CONSTANT = 1;

    /**
     * A description of this property.
     *
     * @var string[]
     */
    protected array $items = [];

    /**
     * A description of what this method does.
     *
     * @param int    $userid   The user's ID.
     * @param string $message  The message to display.
     * @return bool True on success.
     * @throws \moodle_exception When something goes wrong.
     */
    public function do_something(int $userid, string $message): bool {
        // ...
    }
}
```

### Global Variables

Use Moodle's global variables via the `global` keyword at the start of each function/method that needs them:

```php
public static function some_method(): void {
    global $CFG, $DB, $PAGE, $USER, $OUTPUT;

    // $CFG  - configuration object
    // $DB   - database abstraction layer
    // $PAGE - current page object
    // $USER - current user object
    // $OUTPUT - renderer factory
}
```

### Database API

Always use the `$DB` abstraction layer — never write raw SQL directly via PDO or mysqli.

```php
// Fetch a single record (returns false if not found).
$record = $DB->get_record('forum', ['id' => $forumid], '*', MUST_EXIST);

// Fetch multiple records.
$records = $DB->get_records('forum', ['course' => $courseid]);

// Parameterised SQL.
$sql = "SELECT f.id, f.name
          FROM {forum} f
         WHERE f.course = :courseid
           AND f.type = :type";
$params = ['courseid' => $courseid, 'type' => 'general'];
$forums = $DB->get_records_sql($sql, $params);

// Insert a record.
$id = $DB->insert_record('forum_subscriptions', $record);

// Update a record.
$DB->update_record('forum', $record);

// Delete records.
$DB->delete_records('forum_subscriptions', ['userid' => $userid, 'forum' => $forumid]);
```

### Contexts and Capabilities

Always validate context and check capabilities before performing privileged operations:

```php
$context = \context_module::instance($cm->id);
self::validate_context($context);  // In external_api subclasses.
require_login($course, true, $cm); // In page-level scripts.

if (!has_capability('mod/forum:viewdiscussion', $context)) {
    throw new \moodle_exception('nopermissions', 'error', '', 'viewdiscussion');
}
```

### External (Web Service) API

External API classes reside in `classes/external/` and extend `core_external\external_api`. The three required static methods are:

```php
namespace mod_example\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_single_structure;
use core_external\external_value;

/**
 * External function to do something.
 *
 * @package   mod_example
 * @category  external
 * @copyright 2025 Your Name <you@example.com>
 * @license   http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class do_something extends external_api {

    /**
     * Describe the parameters.
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'itemid' => new external_value(PARAM_INT, 'The item ID'),
            'value'  => new external_value(PARAM_TEXT, 'The new value'),
        ]);
    }

    /**
     * Execute the function.
     *
     * @param int    $itemid The item ID.
     * @param string $value  The new value.
     * @return \stdClass
     */
    public static function execute(int $itemid, string $value): \stdClass {
        global $DB, $USER;

        $params = self::validate_parameters(self::execute_parameters(), [
            'itemid' => $itemid,
            'value'  => $value,
        ]);

        // Validate context, check capabilities, perform work ...

        return (object) ['success' => true];
    }

    /**
     * Describe the return value.
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'success' => new external_value(PARAM_BOOL, 'True when successful'),
        ]);
    }
}
```

### Strings

Never hard-code user-visible strings. Always use `get_string()`:

```php
// Retrieve a string from the plugin's language file.
$label = get_string('stringidentifier', 'mod_example');

// With a substitution variable.
$message = get_string('hellouser', 'mod_example', $USER->firstname);
```

### Exceptions

Use Moodle's own exception classes rather than bare `\Exception`:

```php
throw new \moodle_exception('invalidcourse', 'error');
throw new \coding_exception('This method requires a valid context.');
throw new \required_capability_exception($context, 'mod/example:view', 'nopermissions', 'error');
```

### Indentation & Formatting

- **4 spaces** per indentation level (no tabs).
- Opening brace for classes and functions on the **same line** as the declaration.
- Single blank line between methods.
- No trailing whitespace.
- Maximum line length: **132 characters** (soft) as per Moodle standard.

---

## AMD JavaScript Coding Style

### ES6 Modules — Mandatory

Moodle 5.1 uses **ES6 native module syntax exclusively**. Never use the old AMD `define()` wrapper.

**Correct (ES6 import/export):**

```js
import Ajax from 'core/ajax';
import {call as fetchMany} from 'core/ajax';
import * as Notification from 'core/notification';
```

**Incorrect (do not use):**

```js
// ❌ Never use this pattern in Moodle 5.1.
define(['core/ajax', 'core/notification'], function(Ajax, Notification) {
    // ...
});
```

### File Structure

All AMD source files live in `<plugindir>/amd/src/` and must start with the GPL license block followed by a JSDoc module header:

```js
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * Short description of what this module does.
 *
 * @module     mod_example/my_module
 * @copyright  2025 Your Name <you@example.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
```

The `@module` tag value follows the pattern `plugintype_pluginname/filename` (matching the AMD module name used in `import` statements).

### Variables

- Use `const` by default.
- Use `let` when reassignment is required.
- **Never** use `var`.

```js
const root = document.getElementById('mycontainer');
let counter = 0;
```

### Functions

Prefer arrow functions for callbacks and short functions. Use named `const` functions for exported or documented top-level functions:

```js
// Named exported function with JSDoc.
/**
 * Initialise the module.
 *
 * @param {HTMLElement} root The root container element.
 */
export const init = (root) => {
    root.addEventListener('click', handleClick);
};

// Private helper using arrow function.
const handleClick = (event) => {
    event.preventDefault();
    // ...
};
```

### JSDoc Comments

Every exported function, and any non-trivial private function, must have a JSDoc block:

```js
/**
 * Fetch recordings from the server.
 *
 * @param   {number} instanceId  The BigBlueButton instance ID.
 * @param   {string} tools       Comma-separated list of tools.
 * @returns {Promise<object[]>}  Resolves with an array of recording objects.
 */
export const fetchRecordings = (instanceId, tools) => {
    // ...
};
```

### Ajax / Web Service Calls

Use the `repository` pattern. Create a dedicated `amd/src/repository.js` file for all web service calls, using `{call as fetchMany} from 'core/ajax'`:

```js
// mod_example/amd/src/repository.js

import {call as fetchMany} from 'core/ajax';

/**
 * Fetch a list of items from the server.
 *
 * @param   {number} courseid The course ID.
 * @returns {Promise}
 */
export const getItems = (courseid) => fetchMany([{
    methodname: 'mod_example_get_items',
    args: {courseid},
}])[0];

/**
 * Save an item.
 *
 * @param   {number} itemid  The item ID.
 * @param   {string} value   The new value.
 * @returns {Promise}
 */
export const saveItem = (itemid, value) => fetchMany([{
    methodname: 'mod_example_save_item',
    args: {itemid, value},
}])[0];
```

Then in your module, import from the repository:

```js
import {getItems, saveItem} from 'mod_example/repository';
```

### Templates

Render Mustache templates using `core/templates`:

```js
import {renderForPromise, replaceNodeContents} from 'core/templates';
import Notification from 'core/notification';

const renderList = async(root, context) => {
    try {
        const {html, js} = await renderForPromise('mod_example/item_list', context);
        replaceNodeContents(root, html, js);
    } catch (error) {
        Notification.exception(error);
    }
};
```

### Strings

Fetch language strings from PHP using `core/str`:

```js
import {get_string as getString, get_strings as getStrings} from 'core/str';

// Single string.
const label = await getString('save', 'core');

// Multiple strings in one request.
const [saveLabel, cancelLabel] = await getStrings([
    {key: 'save', component: 'core'},
    {key: 'cancel', component: 'core'},
]);
```

### Notifications and Errors

```js
import Notification from 'core/notification';

// Display an exception / error to the user.
try {
    await doSomething();
} catch (error) {
    Notification.exception(error);
}

// Display a simple alert.
await Notification.alert('Title', 'Message body');

// Show a confirm dialogue.
const confirmed = await Notification.confirm('Title', 'Are you sure?', 'Yes', 'No');
```

### Events

Use `core/event_dispatcher` to dispatch and listen for custom events:

```js
// events.js — define event type constants.
import {dispatchEvent} from 'core/event_dispatcher';

export const eventTypes = {
    itemSaved: 'mod_example/itemSaved',
};

export const notifyItemSaved = (itemId, container = document) =>
    dispatchEvent(eventTypes.itemSaved, {itemId}, container);
```

```js
// In another module, listen for the event.
import {eventTypes} from 'mod_example/events';

document.addEventListener(eventTypes.itemSaved, (event) => {
    const {itemId} = event.detail;
    // ...
});
```

### Async / Await

Prefer `async`/`await` over raw `.then()` chains for readability:

```js
// Preferred.
export const loadAndRender = async(root) => {
    const data = await getItems(root.dataset.courseid);
    const {html, js} = await renderForPromise('mod_example/list', {items: data});
    replaceNodeContents(root, html, js);
};

// Acceptable for simple one-liners.
export const remove = (id) => deleteItem(id).then(() => refreshList());
```

### Module Structure Pattern

A typical AMD module that initialises UI behaviour:

```js
// mod_example/amd/src/example.js

import {getItems} from 'mod_example/repository';
import {renderForPromise, replaceNodeContents} from 'core/templates';
import Notification from 'core/notification';
import Selectors from 'mod_example/selectors';

/**
 * Register event listeners.
 *
 * @param {HTMLElement} root The root element.
 */
const registerEventListeners = (root) => {
    root.addEventListener('click', async(event) => {
        const trigger = event.target.closest(Selectors.actions.refresh);
        if (!trigger) {
            return;
        }
        event.preventDefault();

        try {
            const items = await getItems(root.dataset.courseid);
            const {html, js} = await renderForPromise('mod_example/item_list', {items});
            replaceNodeContents(root.querySelector(Selectors.regions.list), html, js);
        } catch (error) {
            Notification.exception(error);
        }
    });
};

/**
 * Initialise the example module.
 *
 * @param {string} rootSelector A CSS selector for the root element.
 */
export const init = (rootSelector) => {
    const root = document.querySelector(rootSelector);
    if (!root) {
        return;
    }
    registerEventListeners(root);
};
```

### Selectors Module Pattern

Define CSS selectors in a dedicated `selectors.js` file:

```js
// mod_example/amd/src/selectors.js

/**
 * Selectors for mod_example.
 *
 * @module     mod_example/selectors
 * @copyright  2025 Your Name <you@example.com>
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
export default {
    actions: {
        refresh: '[data-action="refresh"]',
        delete:  '[data-action="delete"]',
    },
    regions: {
        list:    '[data-region="item-list"]',
        spinner: '[data-region="loading"]',
    },
};
```

### ESLint Configuration

The project uses ESLint with the configuration in `.eslintrc` at the workspace root. Key rules to respect:

- `no-console`: **error** — do not use `console.log()` etc.
- `no-var`: enforced by ES2020 environment — always use `const`/`let`.
- `curly`: **error** — always use braces for control flow blocks.
- `no-eval`: **error**.
- `eqeqeq`: use strict equality (`===` / `!==`).
- 4-space indentation.

### Common Core AMD Modules Reference

| Module | Import path | Purpose |
|---|---|---|
| Ajax calls | `core/ajax` | Call web services |
| Templates | `core/templates` | Render Mustache templates |
| Language strings | `core/str` | Fetch PHP lang strings |
| Notifications | `core/notification` | Alerts, confirms, exceptions |
| Event dispatcher | `core/event_dispatcher` | Dispatch CustomEvents |
| Pub/Sub | `core/pubsub` | Publish/subscribe events |
| Modals | `core/modal` | Display modal dialogues |
| Pending promises | `core/pending` | Track async work for Behat |
| Key codes | `core/key_codes` | Keyboard constants |
| Config | `core/config` | Site/session config values |
| jQuery | `jquery` | DOM helpers (use sparingly; prefer native DOM) |
