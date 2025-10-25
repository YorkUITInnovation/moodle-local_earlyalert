// Example component demonstrating how to use Moodle language strings in React
// Including strings from different Moodle plugins/components
import React from 'react';
import { useLanguageStrings } from '../hooks/useLanguageStrings';

/**
 * Example usage of language strings in a React component
 * This demonstrates how to fetch strings from different Moodle plugins
 */
const LanguageStringExample = () => {
  // Load strings from multiple components using component:key format
  const { strings, getString, loading, error } = useLanguageStrings([
    // From local_earlyalert (no prefix needed, default)
    'pluginname',
    'low_grade',
    'missed_assignment',

    // From core Moodle
    'core:add',
    'core:delete',
    'core:edit',
    'core:save',

    // From mod_assign
    'mod_assign:assignment',
    'mod_assign:submissions'
  ]);

  if (loading) {
    return <div>Loading language strings...</div>;
  }

  if (error) {
    return <div>Error loading strings: {error}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Language Strings Example</h2>

      {/* Strings from local_earlyalert */}
      <div className="mb-4">
        <h3 className="font-semibold">From local_earlyalert:</h3>
        <ul className="list-disc ml-6">
          <li>{getString('pluginname', 'Early Alert')}</li>
          <li>{getString('low_grade', 'Low Grade')}</li>
          <li>{getString('missed_assignment', 'Missed Assignment')}</li>
        </ul>
      </div>

      {/* Strings from core Moodle */}
      <div className="mb-4">
        <h3 className="font-semibold">From core Moodle:</h3>
        <ul className="list-disc ml-6">
          <li>{getString('core:add', 'Add')}</li>
          <li>{getString('core:delete', 'Delete')}</li>
          <li>{getString('core:edit', 'Edit')}</li>
          <li>{getString('core:save', 'Save')}</li>
        </ul>
      </div>

      {/* Strings from mod_assign */}
      <div className="mb-4">
        <h3 className="font-semibold">From mod_assign:</h3>
        <ul className="list-disc ml-6">
          <li>{getString('mod_assign:assignment', 'Assignment')}</li>
          <li>{getString('mod_assign:submissions', 'Submissions')}</li>
        </ul>
      </div>

      {/* Show all loaded strings */}
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">All Loaded Strings:</h3>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(strings, null, 2)}
        </pre>
      </div>
    </div>
  );
};

// Alternative: Using object format for clarity
export const ObjectFormatExample = () => {
  const { getString } = useLanguageStrings([
    {key: 'add', component: 'core'},
    {key: 'delete', component: 'core'},
    {key: 'pluginname', component: 'local_earlyalert'},
    {key: 'assignment', component: 'mod_assign'}
  ]);

  return (
    <div className="flex gap-2">
      <button className="px-4 py-2 bg-blue-500 text-white rounded">
        {getString('core:add', 'Add')}
      </button>
      <button className="px-4 py-2 bg-red-500 text-white rounded">
        {getString('core:delete', 'Delete')}
      </button>
    </div>
  );
};

// You can also load strings dynamically
export const DynamicLoadExample = () => {
  const [extraStrings, setExtraStrings] = React.useState({});
  const { getString } = useLanguageStrings(['pluginname']);

  const loadMoreStrings = async () => {
    const languageService = (await import('../services/languageService')).default;
    await languageService.loadStrings(['core:cancel', 'core:continue']);
    setExtraStrings(languageService.getStrings(['core:cancel', 'core:continue']));
  };

  return (
    <div className="p-4">
      <h3>{getString('pluginname')}</h3>
      <button
        onClick={loadMoreStrings}
        className="px-4 py-2 bg-green-500 text-white rounded"
      >
        Load More Strings
      </button>
      {Object.keys(extraStrings).length > 0 && (
        <div className="mt-4">
          <p>Dynamically loaded strings:</p>
          <pre>{JSON.stringify(extraStrings, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default LanguageStringExample;

