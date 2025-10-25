// React hook for using Moodle language strings
import { useState, useEffect } from 'react';
import languageService from '../services/languageService';

/**
 * Hook to load and use Moodle language strings in React components
 * @param {Array} keys - Optional array of string keys to preload. Can be:
 *   - Simple strings: ['pluginname', 'send'] (defaults to local_earlyalert)
 *   - Component:key format: ['core:add', 'mod_assignment:assignment']
 *   - Objects: [{key: 'add', component: 'core'}]
 * @returns {Object} - { strings, getString, loading, error, isLoaded }
 *
 * @example
 * // Load strings from local_earlyalert (default)
 * const { getString } = useLanguageStrings(['pluginname', 'send']);
 *
 * @example
 * // Load strings from different components
 * const { getString } = useLanguageStrings(['core:add', 'core:delete', 'mod_assign:assignment']);
 *
 * @example
 * // Use object format for clarity
 * const { getString } = useLanguageStrings([
 *   {key: 'add', component: 'core'},
 *   {key: 'pluginname', component: 'local_earlyalert'}
 * ]);
 */
export const useLanguageStrings = (keys = []) => {
  const [strings, setStrings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStrings = async () => {
      try {
        setLoading(true);
        const loadedStrings = await languageService.loadStrings(keys);
        setStrings(loadedStrings);
        setError(null);
      } catch (err) {
        console.error('Error loading language strings:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadStrings();
  }, []); // Only load once on mount

  /**
   * Get a single language string
   * @param {string} key - The string identifier
   * @returns {string}
   */
  const getString = (key) => {
    console.log(`🔍 Hook getString called with key: "${key}"`);
    console.log(`📦 Hook strings state:`, strings);
    console.log(`✅ Hook found value:`, strings[key]);

    // Use the strings from hook state, not from languageService directly
    return strings[key] || key;
  };

  return {
    strings,
    getString,
    loading,
    error,
    isLoaded: languageService.isLoaded()
  };
};

/**
 * Higher-order component to inject language strings as props
 * @param {React.Component} Component - Component to wrap
 * @param {Array} keys - Optional array of string keys to preload
 * @returns {React.Component}
 */
export const withLanguageStrings = (Component, keys = []) => {
  return (props) => {
    const { strings, getString, loading, error } = useLanguageStrings(keys);

    return (
      <Component
        {...props}
        strings={strings}
        getString={getString}
        stringsLoading={loading}
        stringsError={error}
      />
    );
  };
};

export default useLanguageStrings;

