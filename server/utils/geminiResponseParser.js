/**
 * Gemini API Response Parser Utilities
 * Helper functions to extract JSON from various Gemini API response formats
 */

/**
 * Attempts to find and validate a JSON string within an object
 * @param {*} obj - The object to search
 * @param {Set} visited - Set of already visited objects to prevent circular references
 * @returns {string|null} - Valid JSON string or null
 */
function findJsonString(obj, visited = new Set()) {
  if (obj == null) return null;
  
  // Check if it's a string that might be JSON
  if (typeof obj === 'string') {
    const trimmed = obj.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        JSON.parse(trimmed);
        return trimmed;
      } catch {
        // Not valid JSON
      }
    }
    return null;
  }
  
  if (typeof obj !== 'object') return null;
  if (visited.has(obj)) return null;
  visited.add(obj);

  // Search arrays
  if (Array.isArray(obj)) {
    for (const element of obj) {
      const found = findJsonString(element, visited);
      if (found) return found;
    }
    return null;
  }

  // Search object properties
  for (const key of Object.keys(obj)) {
    try {
      const found = findJsonString(obj[key], visited);
      if (found) return found;
    } catch {
      // Continue searching
    }
  }

  return null;
}

/**
 * Common paths where Gemini might place the response text
 */
const RESPONSE_PATHS = [
  (data) => data?.candidates?.[0]?.content?.parts?.[0]?.text,
  (data) => data?.candidates?.[0]?.content?.[0]?.text,
  (data) => data?.candidates?.[0]?.output?.[0]?.content?.[0]?.text,
  (data) => data?.candidates?.[0]?.message?.content?.[0]?.text,
  (data) => data?.output?.[0]?.content?.[0]?.text,
  (data) => data?.choices?.[0]?.message?.content?.[0]?.text,
  (data) => data?.choices?.[0]?.text,
];

/**
 * Extracts JSON string from Gemini API response
 * Tries common paths first, then falls back to deep search
 * @param {object} responseData - The API response data
 * @returns {string|null} - Extracted JSON string or null
 */
function extractJsonFromResponse(responseData) {
  // Try common structured locations first
  for (const pathFunc of RESPONSE_PATHS) {
    try {
      const result = pathFunc(responseData);
      if (typeof result === 'string' && result.trim()) {
        return result;
      }
    } catch {
      // Continue to next path
    }
  }

  // Fallback: deep search for any JSON string
  return findJsonString(responseData);
}

/**
 * Parses and validates the extracted JSON string
 * @param {string} jsonString - The JSON string to parse
 * @returns {object} - Parsed floor plan object
 * @throws {Error} - If parsing fails
 */
function parseFloorPlanJson(jsonString) {
  if (!jsonString) {
    throw new Error('No JSON content found in Gemini API response');
  }

  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('JSON parsing failed. First 500 chars:', jsonString.slice(0, 500));
    throw new Error(`Failed to parse floor plan JSON: ${error.message}`);
  }
}

module.exports = {
  extractJsonFromResponse,
  parseFloorPlanJson,
  findJsonString,
};
