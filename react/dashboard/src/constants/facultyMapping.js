/**
 * Faculty Mapping Constants
 * 
 * Centralized faculty code to full name mapping for York University.
 * This is the single source of truth for all faculty-related mappings in the application.
 * 
 * The proper faculty names are based on the official York University faculty names.
 */

// Primary faculty code to full name mapping
export const FACULTY_NAMES = {
  'AP': 'Faculty of Liberal Arts & Professional Studies',
  'ED': 'Faculty of Education',
  'EU': 'Faculty of Environmental & Urban Change',
  'FA': 'School of the Arts, Media, Performance & Design',
  'GL': 'Glendon College / Collège universitaire Glendon',
  'GS': 'Faculty of Graduate Studies',
  'HH': 'Faculty of Health',
  'LE': 'Lassonde School of Engineering',
  'LW': 'Osgoode Hall Law School',
  'SB': 'Schulich School of Business',
  'SC': 'Faculty of Science'
};

// Comprehensive faculty mapping including aliases and variations
// Maps various faculty identifiers to their canonical full names
export const facultyMapping = {
  // Primary codes
  'AP': 'Faculty of Liberal Arts & Professional Studies',
  'ED': 'Faculty of Education',
  'EU': 'Faculty of Environmental & Urban Change',
  'FA': 'School of the Arts, Media, Performance & Design',
  'GL': 'Glendon College / Collège universitaire Glendon',
  'GS': 'Faculty of Graduate Studies',
  'HH': 'Faculty of Health',
  'LE': 'Lassonde School of Engineering',
  'LW': 'Osgoode Hall Law School',
  'SB': 'Schulich School of Business',
  'SC': 'Faculty of Science',
  
  // Legacy/Alternative codes
  'LAPS': 'Faculty of Liberal Arts & Professional Studies',
  'AMPD': 'School of the Arts, Media, Performance & Design',
  
  // Common variations and partial names
  'Schulich': 'Schulich School of Business',
  'Lassonde': 'Lassonde School of Engineering',
  'Science': 'Faculty of Science',
  'Health': 'Faculty of Health',
  'Graduate Studies': 'Faculty of Graduate Studies',
  'Glendon': 'Glendon College / Collège universitaire Glendon',
  'Education': 'Faculty of Education',
  'Environment and Urban Change': 'Faculty of Environmental & Urban Change',
  'Environmental': 'Faculty of Environmental & Urban Change',
  'Osgoode': 'Osgoode Hall Law School',
  'Liberal Arts': 'Faculty of Liberal Arts & Professional Studies',
  'Liberal Arts & Professional Studies': 'Faculty of Liberal Arts & Professional Studies'
};

/**
 * Helper function to get faculty code from full name or partial name
 * @param {string} fullName - Full faculty name or partial name
 * @returns {string} Faculty code (e.g., 'AP', 'SC', 'LE') or original input if not found
 */
export const getFacultyCode = (fullName) => {
  if (!fullName) return fullName;
  
  // Direct lookup if it's already a code
  if (FACULTY_NAMES[fullName]) return fullName;
  
  // Find by matching full name
  for (const [code, name] of Object.entries(FACULTY_NAMES)) {
    if (fullName === name || fullName.includes(name) || name.includes(fullName)) {
      return code;
    }
  }
  
  // Check partial matches for common keywords
  if (fullName.includes('Lassonde')) return 'LE';
  if (fullName.includes('Glendon')) return 'GL';
  if (fullName.includes('Science')) return 'SC';
  if (fullName.includes('Health')) return 'HH';
  if (fullName.includes('Liberal Arts')) return 'AP';
  if (fullName.includes('Education')) return 'ED';
  if (fullName.includes('Environmental')) return 'EU';
  if (fullName.includes('Osgoode')) return 'LW';
  if (fullName.includes('Schulich')) return 'SB';
  if (fullName.includes('Arts, Media')) return 'FA';
  if (fullName.includes('Graduate Studies')) return 'GS';
  
  return fullName;
};

/**
 * Helper function to get full faculty name from code or partial name
 * @param {string} codeOrName - Faculty code or partial name
 * @returns {string} Full faculty name or original input if not found
 */
export const getFacultyName = (codeOrName) => {
  if (!codeOrName) return codeOrName;
  
  // Check if it's in facultyMapping (handles codes and variations)
  if (facultyMapping[codeOrName]) {
    return facultyMapping[codeOrName];
  }
  
  // Return original if not found
  return codeOrName;
};

