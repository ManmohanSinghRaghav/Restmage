// ===========================
// STATE.JS - Centralized State Management
// ===========================

const AppState = {
    // Map Information
    mapInfo: {
        title: "Floor Plan",
        author: "Architect",
        date: new Date().toISOString().split('T')[0],
        scale: "1:100",
        north_direction: "Top of map"
    },
    
    // Plot Configuration
    plotSummary: {
        plot_length_ft: 50.0,
        plot_width_ft: 30.0,
        setback_front_ft: 5.0,
        setback_rear_ft: 3.0,
        setback_side_left_ft: 3.0,
        setback_side_right_ft: 3.0
    },
    
    // Elements Arrays
    rooms: [],      // Polygon rooms
    walls: [],      // Wall segments
    doors: [],      // Door openings
    windows: [],    // Window openings
    stairs: [],     // Staircases
    fixtures: [],   // Fixtures (toilet, sink, etc.)
    
    // UI State
    activeTool: 'select',  // current tool: select, room, wall, door, window, fixture
    selectedElement: null, // currently selected element
    selectedType: null,    // type of selected element: 'room', 'wall', 'door', 'window', 'fixture'
    
    // Canvas State
    scale: 10,      // pixels per foot
    offsetX: 60,    // canvas offset X
    offsetY: 60,    // canvas offset Y
    zoom: 1,        // zoom level
    
    // Drawing State (for temporary elements)
    isDrawing: false,
    drawingPoints: [],  // for polygon drawing
    tempStart: null,    // for wall drawing
    
    // Selection box (for drag-to-select)
    selectionBox: null, // { startX, startY, endX, endY } in feet
    
    // Selected fixture type
    selectedFixtureType: 'toilet',
    
    // Undo/Redo History
    history: [],
    historyIndex: -1,
    maxHistorySize: 50
};

// ===========================
// UNDO/REDO SYSTEM
// ===========================

function saveStateToHistory() {
    const state = AppState;
    
    // Create a snapshot of the current state
    const snapshot = {
        rooms: JSON.parse(JSON.stringify(state.rooms)),
        walls: JSON.parse(JSON.stringify(state.walls)),
        doors: JSON.parse(JSON.stringify(state.doors)),
        windows: JSON.parse(JSON.stringify(state.windows)),
        fixtures: JSON.parse(JSON.stringify(state.fixtures)),
        stairs: JSON.parse(JSON.stringify(state.stairs)),
        mapInfo: JSON.parse(JSON.stringify(state.mapInfo)),
        plotSummary: JSON.parse(JSON.stringify(state.plotSummary))
    };
    
    // Remove any history after current index (when user made changes after undo)
    state.history = state.history.slice(0, state.historyIndex + 1);
    
    // Add new snapshot
    state.history.push(snapshot);
    state.historyIndex = state.history.length - 1;
    
    // Limit history size
    if (state.history.length > state.maxHistorySize) {
        state.history.shift();
        state.historyIndex--;
    }
    
    if (typeof updateUndoRedoButtons === 'function') {
        updateUndoRedoButtons();
    }
}

function undo() {
    const state = AppState;
    
    if (state.historyIndex > 0) {
        state.historyIndex--;
        restoreSnapshot(state.history[state.historyIndex]);
        showToast('Undone', 'info');
    }
}

function redo() {
    const state = AppState;
    
    if (state.historyIndex < state.history.length - 1) {
        state.historyIndex++;
        restoreSnapshot(state.history[state.historyIndex]);
        showToast('Redone', 'info');
    }
}

function restoreSnapshot(snapshot) {
    const state = AppState;
    
    state.rooms = JSON.parse(JSON.stringify(snapshot.rooms));
    state.walls = JSON.parse(JSON.stringify(snapshot.walls));
    state.doors = JSON.parse(JSON.stringify(snapshot.doors));
    state.windows = JSON.parse(JSON.stringify(snapshot.windows));
    state.fixtures = JSON.parse(JSON.stringify(snapshot.fixtures));
    state.stairs = JSON.parse(JSON.stringify(snapshot.stairs));
    state.mapInfo = JSON.parse(JSON.stringify(snapshot.mapInfo));
    state.plotSummary = JSON.parse(JSON.stringify(snapshot.plotSummary));
    
    clearSelection();
    updateUndoRedoButtons();
    
    if (typeof render === 'function') render();
    if (typeof updateUI === 'function') updateUI();
}

function canUndo() {
    return AppState.historyIndex > 0;
}

function canRedo() {
    return AppState.historyIndex < AppState.history.length - 1;
}

function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    
    if (undoBtn) undoBtn.disabled = !canUndo();
    if (redoBtn) redoBtn.disabled = !canRedo();
}

// ===========================
// STATE HELPER FUNCTIONS
// ===========================

function getState() {
    return AppState;
}

function setState(updates) {
    Object.assign(AppState, updates);
}

function addRoom(room) {
    AppState.rooms.push(room);
    saveStateToHistory();
}

function addWall(wall) {
    AppState.walls.push(wall);
    saveStateToHistory();
}

function addDoor(door) {
    AppState.doors.push(door);
    saveStateToHistory();
}

function addWindow(window) {
    AppState.windows.push(window);
    saveStateToHistory();
}

function addFixture(fixture) {
    AppState.fixtures.push(fixture);
    saveStateToHistory();
}

function addStair(stair) {
    AppState.stairs.push(stair);
    saveStateToHistory();
}

function removeElement(type, element) {
    const arrayName = type + 's'; // 'room' -> 'rooms'
    const array = AppState[arrayName];
    const index = array.indexOf(element);
    if (index > -1) {
        array.splice(index, 1);
        saveStateToHistory();
    }
}

function clearSelection() {
    AppState.selectedElement = null;
    AppState.selectedType = null;
}

function selectElement(type, element) {
    AppState.selectedElement = element;
    AppState.selectedType = type;
}

function setActiveTool(tool) {
    AppState.activeTool = tool;
    AppState.isDrawing = false;
    AppState.drawingPoints = [];
    AppState.tempStart = null;
}

function getAllElements() {
    return {
        rooms: AppState.rooms,
        walls: AppState.walls,
        doors: AppState.doors,
        windows: AppState.windows,
        fixtures: AppState.fixtures,
        stairs: AppState.stairs
    };
}

function getTotalBuiltUpArea() {
    return AppState.rooms.reduce((sum, room) => sum + calculatePolygonArea(room.polygon), 0);
}

function getPlotArea() {
    return AppState.plotSummary.plot_length_ft * AppState.plotSummary.plot_width_ft;
}

function getCounts() {
    return {
        rooms: AppState.rooms.length,
        walls: AppState.walls.length,
        doors: AppState.doors.length,
        windows: AppState.windows.length,
        fixtures: AppState.fixtures.length,
        stairs: AppState.stairs.length
    };
}
