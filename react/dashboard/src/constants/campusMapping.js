/**
 * Campus Mapping Constants
 * 
 * Centralized campus code to full name mapping for York University.
 * This is the single source of truth for all campus-related mappings in the application.
 * 
 * The campus codes are based on York University's campus identifiers.
 */

// Primary campus code to full name mapping
export const CAMPUS_NAMES = {
  'G': 'Glendon',
  'K': 'Keele',
  'M': 'Markham'
};

// Comprehensive campus mapping including aliases and variations
// Maps various campus identifiers to their canonical full names
export const campusMapping = {
  // Primary codes
  'G': 'Glendon',
  'K': 'Keele',
  'M': 'Markham',
  
  // Full names (for reverse lookup)
  'Glendon': 'Glendon',
  'Keele': 'Keele',
  'Markham': 'Markham',
  
  // Common variations
  'Glendon Campus': 'Glendon',
  'Keele Campus': 'Keele',
  'Markham Campus': 'Markham',
  'Markham Centre': 'Markham',
  'Markham Centre Campus': 'Markham'
};

/**
 * Helper function to get campus code from full name or partial name
 * @param {string} fullName - Full campus name or partial name
 * @returns {string} Campus code (e.g., 'G', 'K', 'M') or original input if not found
 */
export const getCampusCode = (fullName) => {
  if (!fullName) return fullName;
  
  // Direct lookup if it's already a code
  if (CAMPUS_NAMES[fullName]) return fullName;
  
  // Find by matching full name
  for (const [code, name] of Object.entries(CAMPUS_NAMES)) {
    if (fullName === name || fullName.includes(name) || name.includes(fullName)) {
      return code;
    }
  }
  
  // Check partial matches for common keywords
  if (fullName.includes('Glendon')) return 'G';
  if (fullName.includes('Keele')) return 'K';
  if (fullName.includes('Markham')) return 'M';
  
  return fullName;
};

/**
 * Helper function to get full campus name from code or partial name
 * @param {string} codeOrName - Campus code or partial name
 * @returns {string} Full campus name or original input if not found
 */
export const getCampusName = (codeOrName) => {
  if (!codeOrName) return codeOrName;
  
  // Check if it's in campusMapping (handles codes and variations)
  if (campusMapping[codeOrName]) {
    return campusMapping[codeOrName];
  }
  
  // Return original if not found
  return codeOrName;
};

