# Moodle Language Strings in React Dashboard

This guide explains how to use Moodle's language system in the React dashboard application.

## Overview

The React dashboard now has full access to Moodle's language strings from **any Moodle plugin or component** through a PHP endpoint. This allows you to:
- Use Moodle's multi-language support in React
- Access strings from core Moodle, any plugin (mod_assign, mod_forum, etc.), or your custom plugins
- Keep language strings centralized in Moodle's language files
- Support all languages configured in Moodle automatically

## Architecture

```
React Component → useLanguageStrings Hook → languageService → get_strings.php → Moodle get_string()
```

## Files Created

1. **`get_strings.php`** - PHP endpoint that fetches language strings from any Moodle component
2. **`src/services/languageService.js`** - Service to communicate with the endpoint
3. **`src/hooks/useLanguageStrings.js`** - React hook for easy component integration
4. **`src/components/LanguageStringExample.js`** - Example component showing usage

## How to Use

### Method 1: Strings from Local Plugin (Default)

```javascript
import { useLanguageStrings } from '../hooks/useLanguageStrings';

const MyComponent = () => {
  const { getString, loading } = useLanguageStrings(['pluginname', 'send', 'cancel']);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{getString('pluginname')}</h1>
      <button>{getString('send', 'Send')}</button>
    </div>
  );
};
```

### Method 2: Strings from Any Moodle Component (component:key format)

```javascript
import { useLanguageStrings } from '../hooks/useLanguageStrings';

const MyComponent = () => {
  // Load strings from different components using component:key format
  const { getString } = useLanguageStrings([
    'pluginname',              // From local_earlyalert (default)
    'core:add',                // From core Moodle
    'core:delete',             // From core Moodle
    'mod_assign:assignment',   // From Assignment module
    'mod_forum:forum'          // From Forum module
  ]);

  return (
    <div>
      <h1>{getString('pluginname')}</h1>
      <button>{getString('core:add')}</button>
      <button>{getString('core:delete')}</button>
      <p>{getString('mod_assign:assignment')}</p>
    </div>
  );
};
```

### Method 3: Object Format (More Explicit)

```javascript
import { useLanguageStrings } from '../hooks/useLanguageStrings';

const MyComponent = () => {
  // Use object format for clarity
  const { getString } = useLanguageStrings([
    {key: 'add', component: 'core'},
    {key: 'delete', component: 'core'},
    {key: 'pluginname', component: 'local_earlyalert'},
    {key: 'assignment', component: 'mod_assign'}
  ]);

  return (
    <div>
      <button>{getString('core:add')}</button>
      <button>{getString('core:delete')}</button>
    </div>
  );
};
```

### Method 4: Direct Service Access

```javascript
import languageService from '../services/languageService';

// Load strings from multiple components
await languageService.loadStrings([
  'core:add',
  'core:save',
  'mod_assign:assignment',
  'pluginname'  // local_earlyalert by default
]);

// Get a string
const addText = languageService.getString('core:add');
const pluginName = languageService.getString('pluginname');
```

## Component:Key Format

The `component:key` format allows you to specify which Moodle plugin or component the string comes from:

- **`core:add`** - "add" string from core Moodle
- **`mod_assign:assignment`** - "assignment" string from Assignment module
- **`mod_forum:forum`** - "forum" string from Forum module
- **`local_earlyalert:pluginname`** - "pluginname" from this plugin
- **`pluginname`** - Defaults to local_earlyalert (backward compatible)

## Common Moodle Components

- **`core`** - Core Moodle strings (add, delete, edit, save, cancel, etc.)
- **`mod_assign`** - Assignment module
- **`mod_forum`** - Forum module
- **`mod_quiz`** - Quiz module
- **`mod_book`** - Book module
- **`block_*`** - Any block plugin
- **`local_*`** - Any local plugin
- **`theme_*`** - Any theme

## API Reference

### useLanguageStrings Hook

**Parameters:**
- `keys` (Array, optional) - String keys to preload. Can be:
  - Simple strings: `['pluginname', 'send']`
  - Component:key format: `['core:add', 'mod_assign:assignment']`
  - Objects: `[{key: 'add', component: 'core'}]`

**Returns:**
```javascript
{
  strings: {},        // Object with all loaded strings
  getString: fn,      // Function to get a single string
  loading: boolean,   // Whether strings are loading
  error: string,      // Error message if loading failed
  isLoaded: boolean   // Whether strings have been loaded
}
```

### getString Function

```javascript
getString(key, defaultValue)
```

**Parameters:**
- `key` (string) - The language string identifier (can use component:key format)
- `defaultValue` (string, optional) - Default value if string not found

**Examples:**
```javascript
getString('pluginname')              // From local_earlyalert
getString('core:add', 'Add')         // From core with default
getString('mod_assign:assignment')   // From mod_assign
```

### PHP Endpoint

**URL:** `/local/earlyalert/react/dashboard/get_strings.php`

**Parameters:**
- `keys` (string/array) - String keys in various formats

**Example Requests:**
```
# Simple keys (comma-separated)
/get_strings.php?keys=pluginname,send,cancel

# Component:key format
/get_strings.php?keys=core:add,core:delete,mod_assign:assignment

# POST with JSON
POST /get_strings.php
{
  "keys": [
    "pluginname",
    "core:add",
    {key: "assignment", component: "mod_assign"}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "strings": {
    "pluginname": "Early Alert",
    "core:add": "Add",
    "mod_assign:assignment": "Assignment"
  },
  "count": 3,
  "timestamp": 1234567890
}
```

## Adding New Language Strings

1. Add the string to your language file:
   ```php
   // In lang/en/local_earlyalert.php
   $string['my_new_string'] = 'My New String';
   ```

2. Use it in React:
   ```javascript
   const { getString } = useLanguageStrings();
   const myString = getString('my_new_string');
   ```

That's it! No rebuild needed - the React app will fetch the string dynamically.

## Common Strings Available

The following strings are preloaded by default if no keys are specified:

- `pluginname` - Plugin name
- `administrative_reports` - Administrative Reports
- `advisor_reports` - Advisor Reports
- `low_grade` - Low Grade
- `missed_assignment` - Missed Assignment
- `missed_exam` - Missed Exam
- `send` - Send
- `cancel` - Cancel
- `preview` - Preview
- `student_lookup` - Student Lookup
- `name` - Name
- `grade` - Grade
- `early_alert` - Early Alert
- `course_overview` - Course Overview
- `my_courses` - My Courses

## Performance Considerations

1. **Caching**: Strings are cached in memory after first load
2. **Preloading**: Specify which strings you need to minimize requests
3. **Default Loading**: If no keys specified, common strings are loaded
4. **Single Request**: All strings loaded in one HTTP request

## Multi-language Support

The system automatically uses the current Moodle user's language preference. No additional configuration needed.

If a user changes their language in Moodle, they need to refresh the React app to see the changes.

## Error Handling

If a string key doesn't exist:
1. The key itself is returned as the value
2. Or the `defaultValue` is used if provided

Example:
```javascript
getString('nonexistent_key', 'Fallback Text')
// Returns: "Fallback Text"
```

## Security

- The endpoint requires Moodle authentication (`require_login()`)
- Only authenticated users can access language strings
- All input is sanitized using Moodle's `clean_param()`

## Troubleshooting

### Strings not loading
- Check browser console for errors
- Verify the PHP endpoint is accessible
- Ensure user is logged into Moodle

### Wrong language showing
- Check user's Moodle language preference
- Verify language strings exist in that language file
- Clear browser cache and reload

### String shows key instead of value
- Verify the string key exists in `lang/en/local_earlyalert.php`
- Check spelling of the key
- Ensure you're using the correct component name ('local_earlyalert')

