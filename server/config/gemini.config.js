/**
 * Gemini API Configuration
 * Centralized configuration for Gemini API integration
 */

console.log('Gemini Model Configured:', process.env.GEMINI_API_MODEL || 'gemini-1.5-flash');

const GEMINI_CONFIG = {
  API_BASE_URL: 'https://generativelanguage.googleapis.com/v1beta',
  MODEL: process.env.GEMINI_API_MODEL || 'gemini-1.5-flash',
  GENERATION_CONFIG: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 65536,
    responseMimeType: 'application/json',
    thinkingConfig: {
      thinkingBudget: 8192
    }
  },
};

const DEFAULT_FLOOR_PLAN_INPUTS = {
  plot_width_ft: 60,
  plot_length_ft: 40,
  entrance_facing: 'west',
  setback_front_ft: 3,
  setback_rear_ft: 3,
  setback_side_left_ft: 3,
  setback_side_right_ft: 3,
  rooms: '2 Bedrooms, 2 Bathrooms, 1 Living Room, 1 Kitchen',
  floors: 1,
  location: 'General',
  vastu_compliance: false,
};

const VASTU_RULES = {
  KITCHEN: 'Southeast (Agneya)',
  MASTER_BEDROOM: 'Southwest (Nairutya)',
  TEMPLE: 'Northeast (Ishanya)',
  BATHROOM: 'Northwest (Vayavya) or West',
  LIVING_ROOM: 'Northeast or North',
};

module.exports = {
  GEMINI_CONFIG,
  DEFAULT_FLOOR_PLAN_INPUTS,
  VASTU_RULES,
};
