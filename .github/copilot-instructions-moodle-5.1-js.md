# Moodle 5.1 JavaScript Style Guide for GitHub Copilot

> This file is intended to guide GitHub Copilot when generating JavaScript for a **Moodle 5.1** codebase.

## Where to put this file

Place this file at:

```text
.github/copilot-instructions.md
```

That location lets GitHub Copilot use these repository-level instructions when suggesting code.

---

## Scope

These instructions apply to **all new JavaScript** in this repository.

GitHub Copilot should generate JavaScript that matches **Moodle 5.1** conventions and architecture.

---

## Core rules

### Use ES6 / ES2015+ modules

- Write all new JavaScript using **ES6 / ES2015+ module syntax**.
- Use `import` / `export`.
- Prefer `const` and `let` over `var`.
- Use arrow functions where appropriate.
- Structure code as Moodle AMD source modules under `lib/amd/src`.
- Remember that Moodle transpiles ES2015+ modules into CommonJS and loads them in the browser with **RequireJS**.

### Do NOT use jQuery

- **Do not generate jQuery code.**
- Do not use jQuery event APIs such as `.on()`, `.click()`, `.done()`, `.fail()`, or `.always()`.
- Prefer **native DOM APIs** and **native Promises**.

### Do NOT use YUI

- **Do not generate YUI code.**
- Do not use YUI modules, YUI widgets, or YUI event patterns.

### Do NOT use React

- **Do not generate React code.**
- Do not use JSX, hooks, components, or React state patterns.
- Moodle 5.1 in this repository should be treated as **non-React**.
- Use Moodle’s standard JavaScript patterns, Mustache templates, and Moodle core modules instead.

---

## Moodle module structure

Follow Moodle’s JavaScript naming and placement conventions:

- Source files go in:

```text
[plugin]/lib/amd/src/
```

Examples:

```text
mod/example/lib/amd/src/helloworld.js
mod/example/lib/amd/src/local/helloworld/selectors.js
mod/example/lib/amd/src/local/helloworld/repository.js
```

Module names should follow Moodle’s component naming format:

```text
[component_name]/[optional/sub/namespace/][modulename]
```

Examples:

```text
mod_forum/discussion
mod_assign/grades/grader
block_newsitems/local/modal/confirmation
core_user/local/participants/selectors
```

### Submodule conventions

When a feature has supporting modules:

- Use a main entry-point module for the feature.
- Place related non-API helper modules under `local/...`.
- Common helper modules often include:
  - `selectors.js`
  - `repository.js`
  - `events.js` (if needed)
  - `utils.js` (if truly necessary and feature-scoped)

Example structure:

```text
core_user/lib/amd/src/
├── participants.js
└── local/
    └── participants/
        ├── repository.js
        └── selectors.js
```

---

## Entry-point pattern

Prefer a single entry-point module that exports an `init` function.

Example:

```js
export const init = () => {
    // Initialization logic.
};
```

Guidance for Copilot:

- Default to exporting `init` for modules intended to be called from PHP or Mustache.
- Keep `init` focused on wiring up the feature.
- Move detailed behavior into small internal functions.
- Export additional functions only when there is a real public module API.

Preferred pattern:

```js
import Selectors from './local/feature/selectors';

const registerEventListeners = () => {
    document.addEventListener('click', event => {
        if (event.target.closest(Selectors.actions.doThing)) {
            // Handle action.
        }
    });
};

export const init = () => {
    registerEventListeners();
};
```

---

## DOM and events

Use **vanilla JavaScript** DOM APIs.

### Preferred patterns

- Use `document.querySelector()` / `querySelectorAll()`.
- Use `addEventListener()`.
- Use `event.target.closest()` for delegated events.
- Use `dataset` / `data-*` attributes to connect markup to JavaScript.
- Keep selectors centralized in a `Selectors` object or in a dedicated `selectors.js` module.

### Avoid

- Do **not** bind behavior using CSS classes intended for styling.
- Do **not** attach one listener per element if event delegation is practical.
- Do **not** use inline JavaScript handlers such as `onclick`.

### Preferred selector strategy

Use `data-action` or similarly purposeful `data-*` attributes.

Example:

```js
export default {
    actions: {
        saveButton: '[data-action="mod_example/save"]',
        cancelButton: '[data-action="mod_example/cancel"]',
    },
};
```

Example delegated listener:

```js
import Selectors from './local/example/selectors';

const registerEventListeners = () => {
    document.addEventListener('click', event => {
        if (event.target.closest(Selectors.actions.saveButton)) {
            // Save action.
        }

        if (event.target.closest(Selectors.actions.cancelButton)) {
            // Cancel action.
        }
    });
};
```

---

## Mustache integration

Moodle JavaScript often works alongside **Mustache templates**.

### Template guidance

- Keep JavaScript logic in AMD source modules, not inline in templates.
- If JavaScript is included from a Mustache template, it must be wrapped in `{{#js}}...{{/js}}`.
- Keep template-side JavaScript minimal: only require the module and call `init(...)`.
- Prefer passing a DOM root element or minimal identifiers into `init`.

Example Mustache usage:

```mustache
<div id="mod_example-wrapper-{{uniqid}}">
    <button data-action="mod_example/save">Save</button>
</div>

{{#js}}
require(['mod_example/feature'], function(Feature) {
    Feature.init(document.querySelector('#mod_example-wrapper-{{uniqid}}'));
});
{{/js}}
```

### Important

- Do not place substantial business logic inside `{{#js}}` blocks.
- Assume inline template JS is not the place for application logic.

---

## Including JavaScript from PHP

When JavaScript must be included from PHP, prefer:

```php
$PAGE->requires->js_call_amd('mod_example/feature', 'init');
```

You may pass small arguments:

```php
$PAGE->requires->js_call_amd('mod_example/feature', 'init', [$courseid]);
```

Guidance for Copilot:

- When showing PHP examples for Moodle initialization, prefer `js_call_amd(...)`.
- Do not suggest legacy inclusion patterns.
- Keep arguments small; avoid pushing large data blobs through `js_call_amd`.

---

## Data flow

### Prefer these approaches

1. **Small initialization data** via `init(...)` or `js_call_amd(...)`.
2. **`data-*` attributes** already present in the DOM.
3. **Moodle web services** for richer or dynamic data.

### Avoid

- Do not pass large, deeply nested payloads into module initialization unless there is a very strong reason.
- Do not duplicate data in multiple places if it already exists in the DOM.

---

## Strings and translations

Use Moodle string APIs instead of hardcoding user-facing text.

### Prefer

```js
import {getString, getStrings} from 'core/str';
```

### Use native Promises

```js
import {getString} from 'core/str';

const showLabel = () => {
    return getString('close', 'core')
        .then(label => {
            window.console.log(label);
            return label;
        });
};
```

Guidance for Copilot:

- Prefer `getString` / `getStrings`.
- Do **not** prefer `get_string` / `get_strings` unless compatibility with older Moodle versions is explicitly required.
- Do **not** use jQuery Promise helpers such as `.done()` or `.fail()`.

---

## Promises and async behavior

Use **native Promises** consistently.

### Rules

- Prefer native Promise chains or `async`/`await` where appropriate for Moodle-supported code.
- Always return Promises from functions whose main job is asynchronous work.
- Use `.then()` and `.catch()` intentionally.
- Only use `.catch()` when you actually need to handle or transform the failure.

### Do NOT

- Do **not** use `.done()`, `.fail()`, or `.always()`.
- Do **not** mix jQuery Deferred patterns into new code.

Example:

```js
const loadSomething = () => {
    return fetchData()
        .then(result => {
            return result;
        });
};
```

---

## Moodle core helpers and modules

When useful, prefer Moodle core modules rather than reinventing common functionality.

Examples include:

- `core/str` for translated strings
- `core/prefetch` for prefetching strings/templates
- `core/dropzone` for accessible drop zones
- other relevant Moodle core AMD modules where appropriate

Guidance for Copilot:

- Prefer Moodle-provided APIs and helpers when available.
- Keep examples aligned with Moodle’s module system.

Example:

```js
import Prefetch from 'core/prefetch';

Prefetch.prefetchString('discussion', 'mod_forum');
Prefetch.prefetchTemplate('core/toast');
```

---

## Code organization

Write small, readable, feature-focused modules.

### Preferred style

- Use `const` by default; use `let` only when reassignment is necessary.
- Keep functions focused and named clearly.
- Extract repeated selectors and repeated DOM access patterns.
- Separate concerns:
  - selectors
  - repository / data access
  - event registration
  - rendering / UI updates
- Keep private helpers unexported unless they are part of the module’s API.

### Avoid

- Large monolithic modules.
- Hidden side effects during import.
- Business logic mixed directly into template JS blocks.
- Global variables.

---

## Accessibility and resilient UI behavior

When generating UI-related JavaScript:

- Preserve keyboard accessibility.
- Prefer accessible Moodle helpers when available.
- Do not assume mouse-only interaction.
- Avoid fragile selectors tied to theme styles.
- Make behavior resilient to partial page updates or dynamically rendered content.

---

## Logging and browser APIs

- Use `window.console` when logging for debugging examples.
- Avoid leaving unnecessary debug logging in production suggestions.
- Use standard browser APIs supported by Moodle 5.1 environments.

---

## What Copilot should do

When asked to write JavaScript for this repository, Copilot should:

- Generate **ES6 / ES2015+** module code.
- Assume **Moodle AMD source layout** under `lib/amd/src`.
- Export an `init` function for entry-point modules.
- Use **RequireJS-compatible Moodle module names**.
- Use **vanilla JavaScript** DOM APIs.
- Use `data-*` attributes and centralized selectors.
- Use Moodle helpers such as `core/str`, `core/prefetch`, and `core/dropzone` when relevant.
- Prefer Mustache + AMD integration patterns already used by Moodle.
- Prefer native Promises.

## What Copilot must NOT do

Copilot must **not**:

- use **jQuery**
- use **YUI**
- use **React**
- use JSX
- generate legacy Moodle JS patterns when a Moodle 5.1 AMD/ES2015+ pattern is appropriate
- attach behavior using styling classes when `data-*` attributes are better
- place substantial logic directly inside Mustache `{{#js}}` blocks
- use `.done()`, `.fail()`, or `.always()` Promise patterns

---

## Preferred code template

Use this as the default shape for new modules:

```js
import Selectors from './local/feature/selectors';
import {getString} from 'core/str';

const registerEventListeners = root => {
    root.addEventListener('click', async event => {
        if (event.target.closest(Selectors.actions.primaryButton)) {
            const label = await getString('savechanges', 'core');
            window.console.log(label);
        }
    });
};

export const init = (root = document) => {
    registerEventListeners(root);
};
```

And a matching selectors module:

```js
export default {
    actions: {
        primaryButton: '[data-action="mod_example/primary-button"]',
    },
};
```

---

## Final instruction for GitHub Copilot

When generating JavaScript for this Moodle 5.1 repository, always follow Moodle’s ES2015+ AMD source-module conventions, prefer native DOM APIs and native Promises, integrate with Mustache and Moodle core modules appropriately, and **never** use jQuery, YUI, or React.
