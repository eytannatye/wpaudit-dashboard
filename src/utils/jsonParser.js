/**
 * Validate and parse wpaudit JSON structure
 */
export const validateWPAuditJSON = (json) => {
  if (!json || typeof json !== 'object') {
    throw new Error('Invalid JSON: Not an object');
  }

  // Check for required top-level fields
  const requiredFields = ['scan_metadata', 'findings'];
  const missingFields = requiredFields.filter(field => !json[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Invalid wpaudit JSON: Missing required fields: ${missingFields.join(', ')}`);
  }

  return true;
};

/**
 * Safely extract nested data
 */
export const safeGet = (obj, path, defaultValue = null) => {
  if (!obj) return defaultValue;
  
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined) {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result !== undefined ? result : defaultValue;
};

/**
 * Parse uploaded JSON file
 */
export const parseWPAuditJSON = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        validateWPAuditJSON(json);
        resolve(json);
      } catch (error) {
        reject(new Error(`Failed to parse JSON: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};

