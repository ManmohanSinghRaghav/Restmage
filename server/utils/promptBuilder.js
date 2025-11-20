/**
 * Gemini API Prompt Builder
 * Creates architect-level prompts for floor plan generation
 */

const { VASTU_RULES } = require('../config/gemini.config');

/**
 * Generates Vastu Shastra rules section for the prompt
 * @param {object} inputs - Floor plan inputs
 * @returns {string} - Formatted Vastu rules text
 */
function generateVastuRulesSection(inputs) {
  if (!inputs.vastu_compliance) return '';

  return `
1. **Vastu Shastra Compliance:**
   * Kitchen in ${VASTU_RULES.KITCHEN}
   * Master Bedroom in ${VASTU_RULES.MASTER_BEDROOM}
   * Pooja/Temple Room in ${VASTU_RULES.TEMPLE}
   * Bathrooms in ${VASTU_RULES.BATHROOM}
   * Living Room in ${VASTU_RULES.LIVING_ROOM}
   * Main Entrance in ${inputs.entrance_facing}
`;
}

/**
 * Generates architectural rules section
 * @param {object} inputs - Floor plan inputs
 * @returns {string} - Formatted architectural rules
 */
function generateArchitecturalRules(inputs) {
  const hasMultipleFloors = (inputs.floors || 1) > 1;
  const stairsRequirement = hasMultipleFloors ? 'stairs,' : '';
  const stairsRule = hasMultipleFloors ? 'Include stairs between floors.' : '';

  return `
--- ARCHITECTURAL RULES ---
${generateVastuRulesSection(inputs)}
2. **Setbacks:** All construction must be inside the setback lines.
3. **Circulation:** Include hallways for access to private rooms. ${stairsRule}
4. **Fixtures:** Add standard fixtures:
   * Bathrooms: Add 'toilet' and 'sink' in each bathroom.
   * Kitchen: Add 'kitchen_sink' and 'stove'.
5. **Completeness:** Generate all walls, doors, windows, ${stairsRequirement} and fixtures.
6. **No Overlaps:** All elements must be spatially coherent and not overlap.
7. **Proper Spacing:** Ensure adequate spacing between rooms and fixtures.
8. **Realistic Dimensions:** Room sizes should be practical and follow standard architectural proportions.
`;
}

/**
 * Creates the complete architect-level prompt for Gemini
 * @param {object} inputs - Floor plan generation inputs
 * @returns {string} - Complete prompt text
 */
function createArchitectPrompt(inputs) {
  const vastuNote = inputs.vastu_compliance ? '(Vastu compliance is important)' : '';
  
  return `
You are a licensed AI Architect. Your task is to generate a complete 2D floor plan with all architectural details.
You must generate all individual map elements: rooms, walls, doors, windows, stairs (if needed), and standard fixtures. 
You must generate the complete JSON response that precisely follows the FloorPlan schema.

--- USER REQUIREMENTS ---
- Plot Dimensions: ${inputs.plot_width_ft}ft Width x ${inputs.plot_length_ft}ft Length
- Entrance Facing: ${inputs.entrance_facing}
- Setbacks: ${inputs.setback_front_ft}ft (Front), ${inputs.setback_rear_ft}ft (Rear), ${inputs.setback_side_left_ft}ft (Left), ${inputs.setback_side_right_ft}ft (Right)
- Required Rooms: ${inputs.rooms}
- Location Context: ${inputs.location || 'General'} ${vastuNote}
- Floors: ${inputs.floors || 1}

${generateArchitecturalRules(inputs)}

Generate a complete, buildable floor plan following these requirements.
`;
}

module.exports = {
  createArchitectPrompt,
  generateVastuRulesSection,
  generateArchitecturalRules,
};
