/**
 * Floor Plan Types
 * TypeScript interfaces for floor plan generation
 */

export interface FloorPlanInputs {
  plot_width_ft?: number;
  plot_length_ft?: number;
  entrance_facing?: string;
  setback_front_ft?: number;
  setback_rear_ft?: number;
  setback_side_left_ft?: number;
  setback_side_right_ft?: number;
  rooms?: string;
  floors?: number;
  location?: string;
  vastu_compliance?: boolean;
}

export interface Point {
  x_ft: number;
  y_ft: number;
}

export interface MapInfo {
  title: string;
  author: string;
  date: string;
  scale: string;
  north_direction: string;
}

export interface PlotSummary {
  plot_width_ft: number;
  plot_length_ft: number;
  setback_front_ft: number;
  setback_rear_ft: number;
  setback_side_left_ft: number;
  setback_side_right_ft: number;
}

export interface Room {
  name: string;
  type: string;
  polygon: Point[];
}

export interface Wall {
  start: Point;
  end: Point;
  thickness_ft: number;
}

export interface Door {
  position: Point;
  width_ft: number;
  swing: string;
}

export interface Window {
  position: Point;
  width_ft: number;
}

export interface Fixture {
  position: Point;
  type: string;
  rotation: number;
}

export interface Stair {
  footprint: Point[];
  direction: string;
  steps: number;
}

export interface FloorPlan {
  _id: string;
  project?: string;
  version: number;
  name?: string;
  map_info: MapInfo;
  plot_summary: PlotSummary;
  rooms: Room[];
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  stairs?: Stair[];
  fixtures?: Fixture[];
  generatedBy: 'ai' | 'manual';
  generationInputs?: any;
  isActive: boolean;
  createdBy: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FloorPlanResponse {
  success: boolean;
  message?: string;
  // API returns the generated plan under `floorPlan` (server) or `data` (other endpoints)
  floorPlan?: FloorPlan;
  data?: FloorPlan;
  alternatives?: FloorPlan[];
}
