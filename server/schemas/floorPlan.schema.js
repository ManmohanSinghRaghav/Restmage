/**
 * Floor Plan JSON Schemas
 * Schema definitions for Gemini API structured output
 */

const PointSchema = {
  type: 'object',
  properties: {
    x_ft: { type: 'number', description: 'X coordinate in feet' },
    y_ft: { type: 'number', description: 'Y coordinate in feet' },
  },
  required: ['x_ft', 'y_ft'],
};

const MapInfoSchema = {
  type: 'object',
  description: 'Contains all the essential metadata for a map',
  properties: {
    title: { type: 'string', description: 'The title of the floor plan' },
    author: { type: 'string', description: 'The entity that generated the map' },
    date: { type: 'string', description: 'The date of generation' },
    scale: { type: 'string', description: 'The map scale' },
    north_direction: { type: 'string', description: 'The direction of North' },
  },
  required: ['title', 'author', 'date', 'scale', 'north_direction'],
};

const RoomSchema = {
  type: 'object',
  description: 'Defines the floor area of a single room',
  properties: {
    name: { type: 'string', description: 'The common name of the room' },
    type: { type: 'string', description: 'Category (e.g., bedroom, kitchen, hallway)' },
    polygon: {
      type: 'array',
      items: PointSchema,
      description: 'A list of (x,y) points defining the room boundary',
    },
  },
  required: ['name', 'type', 'polygon'],
};

const WallSchema = {
  type: 'object',
  description: 'A single wall segment',
  properties: {
    start: PointSchema,
    end: PointSchema,
    thickness_ft: { type: 'number', description: 'Wall thickness in feet' },
  },
  required: ['start', 'end', 'thickness_ft'],
};

const DoorSchema = {
  type: 'object',
  description: 'A door opening',
  properties: {
    position: PointSchema,
    width_ft: { type: 'number', description: 'The width of the door opening' },
    swing: { type: 'string', description: 'Swing direction' },
  },
  required: ['position', 'width_ft', 'swing'],
};

const WindowSchema = {
  type: 'object',
  description: 'A window opening',
  properties: {
    position: PointSchema,
    width_ft: { type: 'number', description: 'The width of the window opening' },
  },
  required: ['position', 'width_ft'],
};

const StairSchema = {
  type: 'object',
  description: 'A staircase',
  properties: {
    footprint: {
      type: 'array',
      items: PointSchema,
      description: 'The polygon outlining the stairs',
    },
    direction: { type: 'string', description: 'e.g., UP or DOWN' },
    steps: { type: 'integer', description: 'The number of steps' },
  },
  required: ['footprint', 'direction', 'steps'],
};

const FixtureSchema = {
  type: 'object',
  description: 'A fixed architectural object',
  properties: {
    position: PointSchema,
    type: { type: 'string', description: 'The type of fixture' },
    rotation: { type: 'number', description: 'Rotation in degrees' },
  },
  required: ['position', 'type', 'rotation'],
};

const PlotSummarySchema = {
  type: 'object',
  description: 'Defines the boundary of the land',
  properties: {
    plot_width_ft: { type: 'number' },
    plot_length_ft: { type: 'number' },
    setback_front_ft: { type: 'number' },
    setback_rear_ft: { type: 'number' },
    setback_side_left_ft: { type: 'number' },
    setback_side_right_ft: { type: 'number' },
  },
  required: [
    'plot_width_ft',
    'plot_length_ft',
    'setback_front_ft',
    'setback_rear_ft',
    'setback_side_left_ft',
    'setback_side_right_ft',
  ],
};

const FloorPlanSchema = {
  type: 'object',
  description: 'The root object for the entire floor plan',
  properties: {
    map_info: MapInfoSchema,
    plot_summary: PlotSummarySchema,
    rooms: { type: 'array', items: RoomSchema },
    walls: { type: 'array', items: WallSchema },
    doors: { type: 'array', items: DoorSchema },
    windows: { type: 'array', items: WindowSchema },
    stairs: { type: 'array', items: StairSchema },
    fixtures: { type: 'array', items: FixtureSchema },
  },
  required: ['map_info', 'plot_summary', 'rooms', 'walls', 'doors', 'windows'],
};

module.exports = {
  PointSchema,
  MapInfoSchema,
  RoomSchema,
  WallSchema,
  DoorSchema,
  WindowSchema,
  StairSchema,
  FixtureSchema,
  PlotSummarySchema,
  FloorPlanSchema,
};
