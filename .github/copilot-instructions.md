# Copilot Instructions

## Core Standards

- Must follow Moodle 5.1 coding standards and guides found in `.github/skills`.
- Never use `declare(strict_types=1);`.
- Use separate folders for appropriate classes (for example, Moodle forms must be in `classes/form`).
- Prefer Moodle core APIs and patterns before introducing custom implementations.

## Moodle Core Reference

- The `moodle501_core` folder contains the core Moodle code and can be used as a reference for understanding Moodle APIs, class structures, hooks, and best practices.
- **Never change, modify, or add code in the `moodle501_core` folder** - it is read-only reference material.
- Use this folder to examine Moodle's implementation of similar features when implementing this plugin.

## UI and Frontend

- Never use `html_writer` class or methods. All display code (HTML) must use templates and `$OUTPUT` renderers.
- Use Bootstrap 5 for HTML and CSS styling.
- For JavaScript modules, use ES6 as described in https://moodledev.io/docs/5.1/guides/javascript.
- Never use jQuery.
- AMD modules are compiled manually; do not compile AMD modules automatically.
- Keep JavaScript source in `amd/src` and follow Moodle AMD module structure.

## Security and Access Control

- Always require authentication and appropriate capability checks before data access or mutation.
- For state-changing actions, require a valid `sesskey`.
- Validate all request inputs using Moodle parameter APIs (`required_param`, `optional_param`, `PARAM_*`).

## Data and Output Safety

- Use Moodle DB APIs (`$DB`) with placeholders; never interpolate untrusted values into SQL.
- Use language strings via `get_string()` for user-facing text; do not hardcode UI strings.
- Ensure output data is safe for rendering and properly formatted for templates/renderers.

## Runtime and Execution

- The development application runs in a container, not on the local machine.
- If running PHP scripts or tests, run them inside the container.

## Testing and Change Scope

- For non-trivial logic changes, add or update automated tests where practical.
- Keep changes focused on the requested scope; avoid unrelated refactors unless explicitly requested.
- Preserve backward compatibility unless a migration/update path is included.
