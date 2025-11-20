/**
 * Gemini API Floor Plan Generator Service
 * Clean, modular implementation for generating floor plans using Google's Gemini AI
 */

const fetch = require('node-fetch');
const { GEMINI_CONFIG, DEFAULT_FLOOR_PLAN_INPUTS } = require('../config/gemini.config');
const { FloorPlanSchema } = require('../schemas/floorPlan.schema');
const { createArchitectPrompt } = require('../utils/promptBuilder');
const { extractJsonFromResponse, parseFloorPlanJson } = require('../utils/geminiResponseParser');

/**
 * Validates and normalizes floor plan inputs
 * @param {object} inputs - Raw input parameters
 * @returns {object} - Normalized inputs with defaults
 */
function normalizeInputs(inputs = {}) {
  return {
    plot_width_ft: inputs.plot_width_ft || DEFAULT_FLOOR_PLAN_INPUTS.plot_width_ft,
    plot_length_ft: inputs.plot_length_ft || DEFAULT_FLOOR_PLAN_INPUTS.plot_length_ft,
    entrance_facing: inputs.entrance_facing || DEFAULT_FLOOR_PLAN_INPUTS.entrance_facing,
    setback_front_ft: inputs.setback_front_ft || DEFAULT_FLOOR_PLAN_INPUTS.setback_front_ft,
    setback_rear_ft: inputs.setback_rear_ft || DEFAULT_FLOOR_PLAN_INPUTS.setback_rear_ft,
    setback_side_left_ft: inputs.setback_side_left_ft || DEFAULT_FLOOR_PLAN_INPUTS.setback_side_left_ft,
    setback_side_right_ft: inputs.setback_side_right_ft || DEFAULT_FLOOR_PLAN_INPUTS.setback_side_right_ft,
    rooms: inputs.rooms || DEFAULT_FLOOR_PLAN_INPUTS.rooms,
    floors: inputs.floors || DEFAULT_FLOOR_PLAN_INPUTS.floors,
    location: inputs.location || DEFAULT_FLOOR_PLAN_INPUTS.location,
    vastu_compliance: inputs.vastu_compliance !== undefined ? inputs.vastu_compliance : DEFAULT_FLOOR_PLAN_INPUTS.vastu_compliance,
  };
}

/**
 * Builds the Gemini API endpoint URL
 * @param {string} apiKey - The Gemini API key
 * @returns {string} - Complete endpoint URL
 */
function buildApiUrl(apiKey) {
  return `${GEMINI_CONFIG.API_BASE_URL}/models/${GEMINI_CONFIG.MODEL}:generateContent?key=${apiKey}`;
}

/**
 * Creates the request body for Gemini API
 * @param {string} prompt - The architect prompt
 * @returns {object} - Request body object
 */
function buildRequestBody(prompt) {
  return {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      ...GEMINI_CONFIG.GENERATION_CONFIG,
      responseSchema: FloorPlanSchema,
    },
  };
}

/**
 * Makes the API call to Gemini
 * @param {string} url - API endpoint URL
 * @param {object} body - Request body
 * @returns {Promise<object>} - API response data
 * @throws {Error} - If API call fails
 */
async function callGeminiApi(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Gemini API Error: ${errorData.error?.message || response.statusText}`);
  }

  return response.json();
}

/**
 * Generates a floor plan using Gemini AI
 * @param {object} inputs - User inputs for floor plan generation
 * @returns {Promise<object>} - Generated floor plan data
 * @throws {Error} - If generation fails
 */
async function generateFloorPlan(inputs) {
  // Validate API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  try {
    // Normalize inputs and create prompt
    const normalizedInputs = normalizeInputs(inputs);
    const prompt = createArchitectPrompt(normalizedInputs);
    
    // Build request
    const url = buildApiUrl(apiKey);
    const requestBody = buildRequestBody(prompt);
    
    // Call API
    console.log('Calling Gemini API for floor plan generation...');
    const responseData = await callGeminiApi(url, requestBody);
    
    // Parse response
    console.log('Gemini API response received successfully');
    const jsonString = extractJsonFromResponse(responseData);
    const floorPlan = parseFloorPlanJson(jsonString);
    
    console.log('Floor plan generated successfully');
    return floorPlan;
    
  } catch (error) {
    console.error('Floor plan generation failed:', error.message);
    throw error;
  }
}

module.exports = {
  generateFloorPlan,
  normalizeInputs,
};
