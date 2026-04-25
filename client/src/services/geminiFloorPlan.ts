/**
 * Floor Plan Generator Service (Client-Side)
 * Clean API client for generating floor plans via server endpoint
 */

import api from './api';
import { FloorPlanInputs, FloorPlan, FloorPlanResponse } from '../types/floorPlan.types';

/**
 * Default values for floor plan generation
 */
export const DEFAULT_INPUTS: FloorPlanInputs = {
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

/**
 * Extracts error message from API response
 */
function getErrorMessage(error: any): string {
  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    'Failed to generate floor plan. Please try again.'
  );
}

/**
 * Generates a floor plan using the server Gemini API endpoint
 * @param inputs - User inputs for floor plan generation
 * @returns Generated floor plan data
 * @throws Error if generation fails
 */
export async function generateFloorPlan(inputs: FloorPlanInputs): Promise<FloorPlan> {
  try {
    console.log('Requesting AI floor plan generation from server...');

    const response = await api.post<FloorPlanResponse>('/floorplan/generate-ai', inputs);

    if (response.data.success && response.data.floorPlan) {
      console.log('AI floor plan generated successfully');
      return response.data.floorPlan;
    }

    throw new Error(response.data.message || 'Failed to generate floor plan');
  } catch (error: any) {
    console.error('Error generating floor plan:', error);
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Quick generation with simplified parameters
 */
export async function generateQuickFloorPlan(params: {
  width?: number;
  length?: number;
  rooms?: string;
}): Promise<FloorPlan> {
  return generateFloorPlan({
    plot_width_ft: params.width || DEFAULT_INPUTS.plot_width_ft,
    plot_length_ft: params.length || DEFAULT_INPUTS.plot_length_ft,
    rooms: params.rooms || DEFAULT_INPUTS.rooms,
    entrance_facing: DEFAULT_INPUTS.entrance_facing,
    setback_front_ft: DEFAULT_INPUTS.setback_front_ft,
    setback_rear_ft: DEFAULT_INPUTS.setback_rear_ft,
    setback_side_left_ft: DEFAULT_INPUTS.setback_side_left_ft,
    setback_side_right_ft: DEFAULT_INPUTS.setback_side_right_ft,
    floors: DEFAULT_INPUTS.floors,
    vastu_compliance: DEFAULT_INPUTS.vastu_compliance,
  });
}
