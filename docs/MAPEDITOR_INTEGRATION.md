# MapEditor Integration Guide

## Overview
The MapEditor has been successfully integrated into the Restmage React application, providing a seamless workflow for AI-powered floor plan generation and editing.

## New Workflow

### User Journey
1. **Input Requirements** → User enters property details in FloorPlanGenerator
2. **Choice Modal** → User chooses between "Generate Floor Plan" or "Get Price Prediction"
3. **AI Generation** → If map chosen, Gemini API generates floor plan JSON
4. **Interactive Editing** → MapEditor loads with drag-and-drop editing capabilities
5. **Export Options** → Export as PNG image or PDF document
6. **Pricing** → Get price estimates at any time during editing

## Components

### 1. MapEditor (`client/src/components/MapEditor/`)
- **MapEditor.tsx**: React wrapper component
- **js/**: Original MapEditor JavaScript modules
  - `app.js`: Main application controller
  - `canvas.js`: Canvas rendering engine
  - `rooms.js`, `walls.js`, `doors.js`, etc.: Feature modules
- **styles/**: CSS files for editor UI

### 2. WorkflowChoice (`client/src/components/FloorPlan/WorkflowChoice.tsx`)
Modal dialog for user choice between map generation and pricing prediction.

### 3. Gemini Integration (`server/routes/gemini.js`)
Backend route for AI-powered floor plan generation with fallback to basic generator.

## API Endpoints

### POST `/api/gemini/generate-map`
Generates floor plan JSON from user requirements using Gemini AI.

**Request:**
```json
{
  "requirements": {
    "plotLength": 10,
    "plotWidth": 10,
    "bedrooms": 3,
    "bathrooms": 2,
    "kitchen": true,
    "livingRoom": true,
    "diningRoom": false,
    "style": "modern"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "plotDimensions": { "length": 10, "width": 10 },
    "rooms": [...],
    "walls": [...],
    "doors": [...],
    "windows": [...]
  },
  "source": "gemini" | "fallback"
}
```

### POST `/api/export/pricing-pdf`
Exports pricing prediction as PDF document.

### POST `/api/export/map-pdf`
Exports floor plan map as PDF document.

## Routes

- `/floorplan` - Floor plan requirements input
- `/project/:projectId/editor` - Interactive map editor
- `/price-prediction` - Price prediction interface

## Features

### Map Editor Features
- ✅ AI-powered layout generation via Gemini
- ✅ Drag-and-drop room editing
- ✅ Wall, door, and window placement
- ✅ Real-time canvas rendering
- ✅ Undo/Redo functionality
- ✅ Export as PNG image
- ✅ Export as PDF document
- ✅ Save to project
- ✅ Integration with pricing system

### Testing
- Unit tests for React components
- Integration tests for API endpoints
- Automated test scripts in package.json

### Logging & Debugging
- Winston logger for server-side logging
- Error tracking and reporting
- Log files in `server/logs/` directory

## Environment Variables

Add to `server/.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

If not set, the system automatically falls back to a basic floor plan generator.

## Running Tests

### Client Tests
```bash
cd client
npm test                    # Run tests in watch mode
npm run test:coverage       # Run with coverage report
npm run test:ci             # Run in CI mode
```

### Server Tests
```bash
cd server
npm test                    # Run tests
npm run test:watch          # Run in watch mode
npm run test:coverage       # Run with coverage
```

### Linting
```bash
# Client
cd client
npm run lint                # Check for issues
npm run lint:fix            # Auto-fix issues

# Server
cd server
npm run lint                # Check for issues
npm run lint:fix            # Auto-fix issues
```

## Dependencies Added

### Server
- `winston` - Logging framework
- `pdfkit` - PDF generation (if not already installed)

### Client
- All existing dependencies support the new features

## File Structure
```
client/src/components/
├── MapEditor/
│   ├── MapEditor.tsx
│   ├── js/
│   │   ├── app.js
│   │   ├── canvas.js
│   │   ├── rooms.js
│   │   ├── walls.js
│   │   └── ...
│   └── styles/
│       ├── main.css
│       ├── panels.css
│       └── tools.css
└── FloorPlan/
    ├── FloorPlanGenerator.tsx
    ├── WorkflowChoice.tsx
    └── WorkflowChoice.test.tsx

server/
├── routes/
│   ├── gemini.js
│   └── export-pdf.js
├── utils/
│   └── logger.js
├── logs/
│   ├── combined.log
│   ├── error.log
│   └── exceptions.log
└── tests/
    └── integration.test.js
```

## Usage Example

```typescript
// 1. User enters requirements in FloorPlanGenerator
// 2. Clicks "Generate Floor Plan"
// 3. WorkflowChoice modal appears
// 4. User selects "Generate Map"
// 5. System calls Gemini API
// 6. New project created with AI-generated map
// 7. User redirected to MapEditor
// 8. User edits floor plan
// 9. User exports as PDF or gets pricing
```

## Troubleshooting

### Gemini API Issues
- If API key is missing/invalid, system automatically uses fallback generator
- Check logs in `server/logs/error.log` for details

### Canvas Rendering Issues
- Ensure browser supports HTML5 Canvas
- Check console for JavaScript errors
- Verify all MapEditor JS files are loaded

### Export Issues
- For PDF export, ensure sufficient memory
- For image export, check canvas size limits

## Future Enhancements
- [ ] 3D visualization mode
- [ ] Collaborative real-time editing
- [ ] Advanced AI suggestions
- [ ] Custom room templates
- [ ] Virtual reality walkthrough
- [ ] Cost estimation integration with map

## Support
For issues or questions, check the main project README or create an issue in the repository.
