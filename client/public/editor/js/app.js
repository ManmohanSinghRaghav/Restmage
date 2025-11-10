// ===========================
// APP.JS - Main Application Controller
// ===========================

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    console.log('Architect Floor Plan Editor v2.0 - Initializing...');
    
    initCanvas();
    initUI();
    initIO();
    initEventHandlers();
    
    // Save initial state to history
    saveStateToHistory();
    
    render();
    updateUndoRedoButtons();
    console.log('Ready!');
});

// ===========================
// EVENT HANDLERS
// ===========================

function initEventHandlers() {
    const canvas = document.getElementById('floorCanvas');
    
    // Mouse events
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('dblclick', handleDoubleClick);
    canvas.addEventListener('wheel', handleMouseWheel, { passive: false });
    
    // Keyboard events
    document.addEventListener('keydown', handleKeyDown);
    
    // Prevent context menu
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
}

// ===========================
// MOUSE HANDLERS
// ===========================

let isDraggingElement = false;
let dragStartPos = null;

function handleMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const { x_ft, y_ft } = screenToFeet(mouseX, mouseY);
    const state = getState();
    
    // Tool-specific handling
    switch (state.activeTool) {
        case 'room':
            handleRoomMouseDown(x_ft, y_ft);
            break;
            
        case 'wall':
            handleWallMouseDown(x_ft, y_ft);
            break;
            
        case 'door':
            handleDoorClick(x_ft, y_ft);
            break;
            
        case 'window':
            handleWindowClick(x_ft, y_ft);
            break;
            
        case 'fixture':
            handleFixtureClick(x_ft, y_ft);
            break;
            
        case 'select':
            handleSelectMouseDown(x_ft, y_ft);
            break;
    }
}

function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const { x_ft, y_ft } = screenToFeet(mouseX, mouseY);
    const state = getState();
    
    // Update coordinate display
    updateMouseCoordinates(x_ft, y_ft);
    
    // Tool-specific handling
    switch (state.activeTool) {
        case 'room':
            handleRoomMouseMove(x_ft, y_ft);
            break;
            
        case 'wall':
            handleWallMouseMove(x_ft, y_ft);
            break;
            
        case 'select':
            if (isDraggingElement) {
                handleDragMove(x_ft, y_ft);
            } else {
                handleSelectMouseMove(x_ft, y_ft);
            }
            break;
    }
}

function handleMouseUp(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const { x_ft, y_ft } = screenToFeet(mouseX, mouseY);
    const state = getState();
    
    // Handle select tool mouse up
    if (state.activeTool === 'select' && !isDraggingElement) {
        handleSelectMouseUp(x_ft, y_ft);
    }
    
    isDraggingElement = false;
    dragStartPos = null;
}

function handleDoubleClick(e) {
    const state = getState();
    
    switch (state.activeTool) {
        case 'room':
            handleRoomDoubleClick();
            break;
    }
}

// ===========================
// SELECT TOOL HANDLERS
// ===========================

function handleSelectMouseDown(x_ft, y_ft) {
    const state = getState();
    
    // Try to select elements in order of priority
    let selected = null;
    let selectedType = null;
    
    // Check fixtures first (smallest)
    selected = findFixtureAtPoint(x_ft, y_ft);
    if (selected) selectedType = 'fixture';
    
    // Then doors
    if (!selected) {
        selected = findDoorAtPoint(x_ft, y_ft);
        if (selected) selectedType = 'door';
    }
    
    // Then windows
    if (!selected) {
        selected = findWindowAtPoint(x_ft, y_ft);
        if (selected) selectedType = 'window';
    }
    
    // Then walls
    if (!selected) {
        selected = findWallAtPoint(x_ft, y_ft, 0.5);
        if (selected) selectedType = 'wall';
    }
    
    // Finally rooms
    if (!selected) {
        selected = findRoomAtPoint(x_ft, y_ft);
        if (selected) selectedType = 'room';
    }
    
    if (selected) {
        selectElement(selectedType, selected);
        isDraggingElement = true;
        dragStartPos = { x_ft, y_ft };
    } else {
        // Start drag-to-select
        clearSelection();
        state.selectionBox = { startX: x_ft, startY: y_ft, endX: x_ft, endY: y_ft };
    }
    
    render();
    updateUI();
}

function handleSelectMouseMove(x_ft, y_ft) {
    const state = getState();
    
    // Update selection box if dragging
    if (state.selectionBox) {
        state.selectionBox.endX = x_ft;
        state.selectionBox.endY = y_ft;
        render();
    }
}

function handleSelectMouseUp(x_ft, y_ft) {
    const state = getState();
    
    // If we were creating a selection box
    if (state.selectionBox) {
        const box = state.selectionBox;
        const minX = Math.min(box.startX, box.endX);
        const maxX = Math.max(box.startX, box.endX);
        const minY = Math.min(box.startY, box.endY);
        const maxY = Math.max(box.startY, box.endY);
        
        // Only select if box is large enough (avoid accidental clicks)
        if (Math.abs(box.endX - box.startX) > 1 || Math.abs(box.endY - box.startY) > 1) {
            // Find all elements within the box
            let foundElement = null;
            let foundType = null;
            
            // Check fixtures
            for (const fixture of state.fixtures) {
                if (fixture.position.x_ft >= minX && fixture.position.x_ft <= maxX &&
                    fixture.position.y_ft >= minY && fixture.position.y_ft <= maxY) {
                    foundElement = fixture;
                    foundType = 'fixture';
                    break;
                }
            }
            
            // Check doors
            if (!foundElement) {
                for (const door of state.doors) {
                    if (door.position.x_ft >= minX && door.position.x_ft <= maxX &&
                        door.position.y_ft >= minY && door.position.y_ft <= maxY) {
                        foundElement = door;
                        foundType = 'door';
                        break;
                    }
                }
            }
            
            // Check windows
            if (!foundElement) {
                for (const window of state.windows) {
                    if (window.position.x_ft >= minX && window.position.x_ft <= maxX &&
                        window.position.y_ft >= minY && window.position.y_ft <= maxY) {
                        foundElement = window;
                        foundType = 'window';
                        break;
                    }
                }
            }
            
            // Check rooms
            if (!foundElement) {
                for (const room of state.rooms) {
                    // Check if any vertex is within the box
                    for (const point of room.polygon) {
                        if (point.x_ft >= minX && point.x_ft <= maxX &&
                            point.y_ft >= minY && point.y_ft <= maxY) {
                            foundElement = room;
                            foundType = 'room';
                            break;
                        }
                    }
                    if (foundElement) break;
                }
            }
            
            if (foundElement) {
                selectElement(foundType, foundElement);
                showToast(`Selected ${foundType}`, 'info', 1500);
            }
        }
        
        state.selectionBox = null;
        render();
        updateUI();
    }
}

function handleDragMove(x_ft, y_ft) {
    const state = getState();
    
    if (!state.selectedElement || !dragStartPos) return;
    
    const deltaX = x_ft - dragStartPos.x_ft;
    const deltaY = y_ft - dragStartPos.y_ft;
    
    switch (state.selectedType) {
        case 'room':
            moveRoom(state.selectedElement, deltaX, deltaY);
            break;
            
        case 'fixture':
            state.selectedElement.position.x_ft += deltaX;
            state.selectedElement.position.y_ft += deltaY;
            break;
            
        case 'door':
        case 'window':
            state.selectedElement.position.x_ft += deltaX;
            state.selectedElement.position.y_ft += deltaY;
            break;
    }
    
    dragStartPos = { x_ft, y_ft };
    render();
    updateUI();
}

// ===========================
// MOUSE WHEEL HANDLER
// ===========================

function handleMouseWheel(e) {
    e.preventDefault();
    
    const state = getState();
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Ctrl+Wheel: Zoom
    if (e.ctrlKey) {
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const oldZoom = state.zoom;
        state.zoom = Math.max(0.3, Math.min(5, state.zoom * zoomFactor));
        
        // Zoom towards mouse position
        const zoomRatio = state.zoom / oldZoom;
        state.offsetX = mouseX - (mouseX - state.offsetX) * zoomRatio;
        state.offsetY = mouseY - (mouseY - state.offsetY) * zoomRatio;
        
        render();
    }
    // Shift+Wheel: Scale adjustment
    else if (e.shiftKey) {
        const scaleInput = document.getElementById('canvasScale');
        const currentScale = parseFloat(scaleInput.value) || 10;
        const newScale = e.deltaY > 0 
            ? Math.max(5, currentScale - 1)
            : Math.min(30, currentScale + 1);
        
        scaleInput.value = newScale;
        state.scale = newScale;
        render();
        showToast(`Scale: ${newScale} px/ft`, 'info', 1500);
    }
    // Regular wheel: Pan
    else {
        state.offsetX -= e.deltaX * 0.5;
        state.offsetY -= e.deltaY * 0.5;
        render();
    }
}

// ===========================
// KEYBOARD HANDLERS
// ===========================

function handleKeyDown(e) {
    const state = getState();
    
    // Tool shortcuts
    if (e.key === 'v' || e.key === 'V') {
        setActiveTool('select');
        updateToolButtons();
        updateCursor();
        hideFixturePalette();
    } else if (e.key === 'r' || e.key === 'R') {
        setActiveTool('room');
        updateToolButtons();
        updateCursor();
        hideFixturePalette();
    } else if (e.key === 'w' || e.key === 'W') {
        setActiveTool('wall');
        updateToolButtons();
        updateCursor();
        hideFixturePalette();
    } else if (e.key === 'd' || e.key === 'D') {
        setActiveTool('door');
        updateToolButtons();
        updateCursor();
        hideFixturePalette();
    } else if (e.key === 'n' || e.key === 'N') {
        setActiveTool('window');
        updateToolButtons();
        updateCursor();
        hideFixturePalette();
    } else if (e.key === 'f' || e.key === 'F') {
        if (e.shiftKey) {
            fitToView();
        } else {
            setActiveTool('fixture');
            updateToolButtons();
            updateCursor();
            showFixturePalette();
        }
    }
    
    // Undo/Redo
    if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
        updateUndoRedoButtons();
        render();
        updateElementsList();
        showToast('Undo', 'info', 1500);
    } else if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        redo();
        updateUndoRedoButtons();
        render();
        updateElementsList();
        showToast('Redo', 'info', 1500);
    }
    
    // Delete selected element
    if (e.key === 'Delete' && state.selectedElement) {
        showConfirm(
            `Delete selected ${state.selectedType}?`,
            () => {
                removeElement(state.selectedType, state.selectedElement);
                clearSelection();
                render();
                updateUI();
                showToast(`${state.selectedType.charAt(0).toUpperCase() + state.selectedType.slice(1)} deleted`, 'success', 2000);
            }
        );
    }
    
    // Escape - cancel current operation or deselect
    if (e.key === 'Escape') {
        if (state.activeTool === 'room') {
            handleRoomKeyPress('Escape');
        } else if (state.activeTool === 'wall') {
            handleWallKeyPress('Escape');
        } else {
            clearSelection();
            render();
            updateUI();
        }
    }
    
    // Enter - finish room drawing
    if (e.key === 'Enter') {
        if (state.activeTool === 'room') {
            handleRoomKeyPress('Enter');
        }
    }
    
    // Zoom with +/-
    if (e.key === '+' || e.key === '=') {
        zoomIn();
    } else if (e.key === '-' || e.key === '_') {
        zoomOut();
    }
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

// Make render globally accessible
window.render = render;

// Make updateUI globally accessible
window.updateUI = updateUI;

// Export for debugging
window.getState = getState;
window.exportToJSON = exportToJSON;

console.log('App initialized. Keyboard shortcuts:');
console.log('V - Select tool');
console.log('R - Room tool');
console.log('W - Wall tool');
console.log('D - Door tool');
console.log('N - Window tool');
console.log('F - Fixture tool');
console.log('Shift+F - Fit to view');
console.log('+/- - Zoom in/out');
console.log('Delete - Remove selected');
console.log('Escape - Cancel/Deselect');
console.log('Enter - Finish room (when drawing)');
