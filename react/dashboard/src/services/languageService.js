// Language strings service for React dashboard
// Provides access to Moodle's language system via PHP endpoint

class LanguageService {
  constructor() {
    this.strings = {};
    this.loaded = false;
    this.loading = false;
    this.loadPromise = null;
  }

  /**
   * Load language strings from Moodle
   * @param {Array} keys - Array of string keys to load. Can be:
   *   - Simple strings: ['pluginname', 'send'] (defaults to local_earlyalert)
   *   - Component:key format: ['core:add', 'mod_assignment:assignment']
   *   - Objects: [{key: 'add', component: 'core'}, {key: 'send', component: 'local_earlyalert'}]
   * @returns {Promise<Object>} - Object with key-value pairs of language strings
   */
  async loadStrings(keys = []) {
    // If already loading, return the existing promise
    if (this.loading && this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = (async () => {
      this.loading = true;

      try {
        console.log('🔄 Loading language strings from Moodle...');

        // Build the request
        const timestamp = new Date().getTime();
        const url = `/local/earlyalert/react/dashboard/get_strings.php?t=${timestamp}`;

        let requestData = null;

        // If specific keys requested, prepare the data
        if (keys && keys.length > 0) {
          // Check if keys are objects or strings
          const hasObjects = keys.some(k => typeof k === 'object');

          if (hasObjects) {
            // Send as JSON for object format
            requestData = JSON.stringify({ keys: keys });
          } else {
            // Send as comma-separated for simple string format
            requestData = JSON.stringify({ keys: keys.join(',') });
          }
        }

        const fetchOptions = {
          method: requestData ? 'POST' : 'GET',
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        };

        if (requestData) {
          fetchOptions.body = requestData;
        }

        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
          throw new Error(`Failed to load language strings: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to load language strings');
        }

        console.log(`✅ Loaded ${data.count} language strings from Moodle`);

        // Merge new strings with existing ones
        this.strings = { ...this.strings, ...data.strings };
        this.loaded = true;
        this.loading = false;

        return this.strings;
      } catch (error) {
        console.error('❌ Failed to load language strings:', error);
        this.loading = false;
        throw error;
      }
    })();

    return this.loadPromise;
  }

  /**
   * Get a specific language string
   * @param {string} key - The string identifier. Can be:
   *   - Simple key: 'pluginname' (looks in local_earlyalert)
   *   - Component:key format: 'core:add', 'mod_assignment:assignment'
   * @param {string} defaultValue - Optional default value if string not found
   * @returns {string} - The translated string
   */
  getString(key, defaultValue = null) {
    // First, try direct lookup
    if (this.strings[key]) {
      return this.strings[key];
    }

    // If key doesn't contain ':', try with local_earlyalert as default component
    // This maintains backward compatibility
    if (!key.includes(':')) {
      // Key without component, already checked above
      return defaultValue !== null ? defaultValue : key;
    }

    // For component:key format, we already have it stored with that format
    // So if it's not found, return default
    return defaultValue !== null ? defaultValue : key;
  }

  /**
   * Get multiple language strings at once
   * @param {Array} keys - Array of string identifiers
   * @returns {Object} - Object with key-value pairs
   */
  getStrings(keys) {
    const result = {};
    keys.forEach(key => {
      result[key] = this.getString(key);
    });
    return result;
  }

  /**
   * Check if strings are loaded
   * @returns {boolean}
   */
  isLoaded() {
    return this.loaded;
  }

  /**
   * Reload strings from server (force refresh)
   * @param {Array} keys - Optional array of specific keys to reload
   * @returns {Promise<Object>}
   */
  async reload(keys = []) {
    this.loaded = false;
    this.loading = false;
    this.loadPromise = null;
    return this.loadStrings(keys);
  }
}

// Create singleton instance
const languageService = new LanguageService();
export default languageService;

