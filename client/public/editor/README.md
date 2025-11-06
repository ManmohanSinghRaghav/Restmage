# Floor Plan Editor

A web-based floor plan editor that allows you to create, edit, and export room layouts as JSON.

## Features Implemented

### ✅ 1. Canvas & Grid System
- Interactive canvas with foot-based grid (1 ft increments)
- Visual plot boundary showing dimensions
- Coordinate labels on axes
- Zoom in/out/fit controls

### ✅ 2. Room Drawing
- **Click and drag** on canvas to create rooms
- Real-time dimension display while drawing
- Automatic position and size capture
- Minimum room size validation (1 ft)

### ✅ 3. Room Selection
- Click any room to select it
- Selected rooms highlighted with red border
- Visual feedback with room information

### ✅ 4. Room Movement
- **Drag selected rooms** to move them
- Real-time position updates
- Smooth dragging interaction

### ✅ 5. Room Resizing
- **Corner handles** appear on selected rooms
- Drag handles to resize rooms
- Maintains minimum size constraints
- Updates dimensions in real-time

### ✅ 6. Properties Panel
- Edit room name (text input)
- Change room type (dropdown with 9 types)
- Manual position adjustment (X, Y in feet)
- Manual dimension adjustment (Length, Width)
- Live area calculation display
- Delete room button

### ✅ 7. Room Types
- Entry
- Living Hall
- Kitchen
- Hallway
- Bedroom
- Bathroom
- Dining
- Utility
- Storage

Each type has unique color coding for easy identification.

### ✅ 8. Plot Configuration
- Adjustable plot dimensions (length × width)
- Updates canvas boundary in real-time
- Default: 40 × 30 ft

### ✅ 9. Summary Panel
- **Plot Area**: Total plot size in sqft
- **Built-up Area**: Sum of all room areas (auto-calculated)
- **Coverage**: Percentage of plot used
- **Room Count**: Total number of rooms

### ✅ 10. JSON Export
- Export button generates JSON in exact format required
- Downloads as `floor-plan.json`
- Includes all rooms with proper structure
- Includes summary with calculated values

**JSON Structure:**
```json
{
  "rooms": [
    {
      "name": "Room Name",
      "type": "bedroom",
      "position": {
        "x_ft": 0,
        "y_ft": 0
      },
      "dimensions": {
        "length_ft": 12,
        "width_ft": 10
      }
    }
  ],
  "summary": {
    "plot_length_ft": 40,
    "plot_width_ft": 30,
    "total_built_up_area_sqft": 120,
    "total_plot_area_sqft": 1200
  }
}
```

### ✅ 11. JSON Import
- Import button loads existing floor plans
- Parses JSON and renders all rooms
- Restores plot dimensions
- Error handling for invalid files

### ✅ 12. Keyboard Shortcuts
- **Delete**: Remove selected room
- **Escape**: Deselect room

### ✅ 13. Visual Features
- Color-coded rooms by type
- Grid overlay with measurements
- Room labels showing name and dimensions
- Responsive design

## How to Use

### Creating Rooms
1. **Draw**: Click and drag on the canvas to create a room
2. The room will appear with default name "Room 1", "Room 2", etc.
3. Edit properties in the sidebar

### Editing Rooms
1. **Select**: Click on a room to select it
2. **Move**: Drag the room to a new position
3. **Resize**: Drag the corner handles to resize
4. **Properties**: Edit name, type, position, and dimensions in the sidebar
5. **Delete**: Click the "Delete Room" button or press Delete key

### Plot Settings
1. Enter plot dimensions in the header (length × width in feet)
2. The canvas will update automatically

### Exporting
1. Click "Export JSON" button
2. A file named `floor-plan.json` will download
3. Use this file in your application or save it for later

### Importing
1. Click "Import JSON" button
2. Select a previously exported JSON file
3. The floor plan will load automatically

## File Structure

```
EditorMap/
├── index.html      # Main HTML structure
├── styles.css      # All styling and layout
└── app.js          # Complete application logic
```

## Code Organization

### app.js Structure

1. **State Management** (Lines 1-20)
   - Global state object
   - Plot dimensions, rooms array, selection state

2. **Room Class** (Lines 22-50)
   - Room data model
   - Methods: getArea(), contains(), getHandles()

3. **Canvas Setup** (Lines 52-70)
   - Canvas initialization
   - Resize handling

4. **Coordinate Conversion** (Lines 72-85)
   - Screen to feet conversion
   - Feet to screen conversion

5. **Rendering** (Lines 87-200)
   - render(): Main render loop
   - drawGrid(): Grid and labels
   - drawPlotBoundary(): Plot outline
   - drawRoom(): Individual rooms
   - drawResizeHandles(): Selection handles

6. **Mouse Events** (Lines 202-350)
   - mousedown: Start draw/drag/resize
   - mousemove: Update position/size
   - mouseup: Finish operation
   - Helper functions for interaction

7. **UI Updates** (Lines 352-400)
   - updatePropertiesPanel(): Sync sidebar with selection
   - updateSummary(): Calculate totals

8. **Event Listeners** (Lines 402-500)
   - Properties panel inputs
   - Plot size inputs
   - Zoom controls

9. **Import/Export** (Lines 502-600)
   - JSON export with download
   - JSON import with file picker

10. **Keyboard Shortcuts** (Lines 602-620)
    - Delete and Escape keys

## Customization Guide

### Adding New Room Types

In `app.js`, find the `typeColors` object (around line 160):

```javascript
const typeColors = {
    entry: '#ffebee',
    living_hall: '#e3f2fd',
    // Add new type here:
    balcony: '#e8eaf6'
};
```

Then add to the HTML select options in `index.html`:
```html
<option value="balcony">Balcony</option>
```

### Changing Default Plot Size

In `app.js`, modify the initial state:
```javascript
const state = {
    plotLength: 50,  // Change from 40
    plotWidth: 40,   // Change from 30
    // ...
};
```

### Adjusting Grid Size

Change the scale (pixels per foot):
```javascript
const state = {
    // ...
    scale: 15,  // Change from 10 (larger = more zoom)
    // ...
};
```

### Changing Colors

Edit `styles.css`:
- Toolbar: `.toolbar` (line 25)
- Canvas: `.canvas-container` (line 69)
- Buttons: `.btn-primary`, `.btn-secondary`, etc. (lines 285-310)

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- IE11: ❌ Not supported (uses ES6 features)

## Future Enhancements (Optional)

- Undo/Redo functionality
- Room rotation
- Door and window placement
- Snap to grid toggle
- Multi-select rooms
- Room templates
- Print to PDF
- Touch/mobile support
- Validation warnings (overlapping rooms)

## License

Free to use and modify.

---

**Created with clean, modular, and maintainable code.**
