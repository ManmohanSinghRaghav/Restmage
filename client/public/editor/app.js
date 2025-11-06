// ===========================
// STATE MANAGEMENT
// ===========================

const state = {
    plotLength: 40,
    plotWidth: 30,
    rooms: [],
    selectedRoom: null,
    scale: 10, // pixels per foot
    offsetX: 50,
    offsetY: 50,
    zoom: 1,
    
    // Drawing state
    isDrawing: false,
    isDragging: false,
    isResizing: false,
    drawStartX: 0,
    drawStartY: 0,
    dragStartX: 0,
    dragStartY: 0,
    resizeHandle: null
};

// ===========================
// ROOM CLASS
// ===========================

class Room {
    constructor(name, type, x_ft, y_ft, length_ft, width_ft) {
        this.id = Date.now() + Math.random(); // Unique ID
        this.name = name;
        this.type = type;
        this.position = { x_ft, y_ft };
        this.dimensions = { length_ft, width_ft };
    }
    
    getArea() {
        return this.dimensions.length_ft * this.dimensions.width_ft;
    }
    
    contains(x_ft, y_ft) {
        return x_ft >= this.position.x_ft &&
               x_ft <= this.position.x_ft + this.dimensions.length_ft &&
               y_ft >= this.position.y_ft &&
               y_ft <= this.position.y_ft + this.dimensions.width_ft;
    }
    
    getHandles() {
        const { x_ft, y_ft } = this.position;
        const { length_ft, width_ft } = this.dimensions;
        
        return {
            topLeft: { x: x_ft, y: y_ft },
            topRight: { x: x_ft + length_ft, y: y_ft },
            bottomLeft: { x: x_ft, y: y_ft + width_ft },
            bottomRight: { x: x_ft + length_ft, y: y_ft + width_ft }
        };
    }
}

// ===========================
// CANVAS SETUP
// ===========================

const canvas = document.getElementById('floorCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    render();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ===========================
// COORDINATE CONVERSION
// ===========================

function screenToFeet(screenX, screenY) {
    const x_ft = (screenX - state.offsetX) / (state.scale * state.zoom);
    const y_ft = (screenY - state.offsetY) / (state.scale * state.zoom);
    return { x_ft, y_ft };
}

function feetToScreen(x_ft, y_ft) {
    const screenX = x_ft * state.scale * state.zoom + state.offsetX;
    const screenY = y_ft * state.scale * state.zoom + state.offsetY;
    return { screenX, screenY };
}

// ===========================
// RENDERING
// ===========================

function render() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    drawGrid();
    
    // Draw plot boundary
    drawPlotBoundary();
    
    // Draw rooms
    state.rooms.forEach(room => {
        drawRoom(room, room === state.selectedRoom);
    });
    
    // Draw selection handles
    if (state.selectedRoom) {
        drawResizeHandles(state.selectedRoom);
    }
    
    // Draw temporary room while drawing
    if (state.isDrawing) {
        drawTemporaryRoom();
    }
}

function drawGrid() {
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    
    const gridSize = state.scale * state.zoom;
    
    // Vertical lines
    for (let x = state.offsetX; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = state.offsetY; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Draw coordinate labels
    ctx.fillStyle = '#999';
    ctx.font = '10px sans-serif';
    
    for (let i = 0; i <= state.plotLength; i += 5) {
        const { screenX } = feetToScreen(i, 0);
        if (screenX > 0 && screenX < canvas.width) {
            ctx.fillText(`${i}ft`, screenX + 2, state.offsetY - 5);
        }
    }
    
    for (let i = 0; i <= state.plotWidth; i += 5) {
        const { screenY } = feetToScreen(0, i);
        if (screenY > 0 && screenY < canvas.height) {
            ctx.fillText(`${i}ft`, state.offsetX - 25, screenY + 3);
        }
    }
}

function drawPlotBoundary() {
    const { screenX: x1, screenY: y1 } = feetToScreen(0, 0);
    const { screenX: x2, screenY: y2 } = feetToScreen(state.plotLength, state.plotWidth);
    
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 2;
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    
    // Label
    ctx.fillStyle = '#3498db';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`Plot: ${state.plotLength} × ${state.plotWidth} ft`, x1 + 10, y1 + 25);
}

function drawRoom(room, isSelected) {
    const { screenX: x, screenY: y } = feetToScreen(room.position.x_ft, room.position.y_ft);
    const width = room.dimensions.length_ft * state.scale * state.zoom;
    const height = room.dimensions.width_ft * state.scale * state.zoom;
    
    // Room fill color based on type
    const typeColors = {
        entry: '#ffebee',
        living_hall: '#e3f2fd',
        kitchen: '#fff3e0',
        hallway: '#f3e5f5',
        bedroom: '#e8f5e9',
        bathroom: '#e0f2f1',
        dining: '#fce4ec',
        utility: '#f1f8e9',
        storage: '#efebe9'
    };
    
    ctx.fillStyle = typeColors[room.type] || '#f5f5f5';
    ctx.fillRect(x, y, width, height);
    
    // Border
    ctx.strokeStyle = isSelected ? '#e74c3c' : '#34495e';
    ctx.lineWidth = isSelected ? 3 : 1;
    ctx.strokeRect(x, y, width, height);
    
    // Room label
    ctx.fillStyle = '#2c3e50';
    ctx.font = `${isSelected ? 'bold ' : ''}12px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    
    ctx.fillText(room.name, centerX, centerY - 8);
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#7f8c8d';
    ctx.fillText(`${room.dimensions.length_ft} × ${room.dimensions.width_ft} ft`, centerX, centerY + 6);
}

function drawResizeHandles(room) {
    const handles = room.getHandles();
    const handleSize = 8;
    
    ctx.fillStyle = '#e74c3c';
    
    Object.values(handles).forEach(handle => {
        const { screenX, screenY } = feetToScreen(handle.x, handle.y);
        ctx.fillRect(screenX - handleSize / 2, screenY - handleSize / 2, handleSize, handleSize);
    });
}

function drawTemporaryRoom() {
    const { x_ft: startX, y_ft: startY } = screenToFeet(state.drawStartX, state.drawStartY);
    const { x_ft: endX, y_ft: endY } = screenToFeet(state.mouseX, state.mouseY);
    
    const x = Math.min(startX, endX);
    const y = Math.min(startY, endY);
    const length = Math.abs(endX - startX);
    const width = Math.abs(endY - startY);
    
    const { screenX, screenY } = feetToScreen(x, y);
    const screenWidth = length * state.scale * state.zoom;
    const screenHeight = width * state.scale * state.zoom;
    
    ctx.fillStyle = 'rgba(52, 152, 219, 0.2)';
    ctx.fillRect(screenX, screenY, screenWidth, screenHeight);
    
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(screenX, screenY, screenWidth, screenHeight);
    ctx.setLineDash([]);
    
    // Show dimensions
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`${length.toFixed(1)} × ${width.toFixed(1)} ft`, 
                 screenX + screenWidth / 2, screenY + screenHeight / 2);
}

// ===========================
// MOUSE EVENTS
// ===========================

canvas.addEventListener('mousedown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const { x_ft, y_ft } = screenToFeet(mouseX, mouseY);
    
    // Check if clicking on resize handle
    if (state.selectedRoom) {
        const handle = getHandleAtPosition(state.selectedRoom, x_ft, y_ft);
        if (handle) {
            state.isResizing = true;
            state.resizeHandle = handle;
            state.dragStartX = mouseX;
            state.dragStartY = mouseY;
            return;
        }
    }
    
    // Check if clicking on a room
    const clickedRoom = getRoomAtPosition(x_ft, y_ft);
    
    if (clickedRoom) {
        state.selectedRoom = clickedRoom;
        state.isDragging = true;
        state.dragStartX = mouseX;
        state.dragStartY = mouseY;
        updatePropertiesPanel();
        render();
    } else {
        // Start drawing new room
        state.selectedRoom = null;
        state.isDrawing = true;
        state.drawStartX = mouseX;
        state.drawStartY = mouseY;
        state.mouseX = mouseX;
        state.mouseY = mouseY;
        updatePropertiesPanel();
        render();
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    state.mouseX = mouseX;
    state.mouseY = mouseY;
    
    if (state.isDrawing) {
        render();
    } else if (state.isDragging && state.selectedRoom) {
        const deltaX = (mouseX - state.dragStartX) / (state.scale * state.zoom);
        const deltaY = (mouseY - state.dragStartY) / (state.scale * state.zoom);
        
        state.selectedRoom.position.x_ft += deltaX;
        state.selectedRoom.position.y_ft += deltaY;
        
        state.dragStartX = mouseX;
        state.dragStartY = mouseY;
        
        updatePropertiesPanel();
        render();
    } else if (state.isResizing && state.selectedRoom) {
        const { x_ft, y_ft } = screenToFeet(mouseX, mouseY);
        resizeRoom(state.selectedRoom, state.resizeHandle, x_ft, y_ft);
        updatePropertiesPanel();
        render();
    }
    
    // Update cursor
    updateCursor(mouseX, mouseY);
});

canvas.addEventListener('mouseup', (e) => {
    if (state.isDrawing) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const { x_ft: startX, y_ft: startY } = screenToFeet(state.drawStartX, state.drawStartY);
        const { x_ft: endX, y_ft: endY } = screenToFeet(mouseX, mouseY);
        
        const x = Math.min(startX, endX);
        const y = Math.min(startY, endY);
        const length = Math.abs(endX - startX);
        const width = Math.abs(endY - startY);
        
        if (length > 0.5 && width > 0.5) {
            const roomCount = state.rooms.length + 1;
            const newRoom = new Room(
                `Room ${roomCount}`,
                'bedroom',
                parseFloat(x.toFixed(1)),
                parseFloat(y.toFixed(1)),
                parseFloat(length.toFixed(1)),
                parseFloat(width.toFixed(1))
            );
            
            state.rooms.push(newRoom);
            state.selectedRoom = newRoom;
            updatePropertiesPanel();
            updateSummary();
        }
        
        state.isDrawing = false;
        render();
    }
    
    state.isDragging = false;
    state.isResizing = false;
    state.resizeHandle = null;
    updateSummary();
});

function getRoomAtPosition(x_ft, y_ft) {
    // Check from top to bottom (last drawn = on top)
    for (let i = state.rooms.length - 1; i >= 0; i--) {
        if (state.rooms[i].contains(x_ft, y_ft)) {
            return state.rooms[i];
        }
    }
    return null;
}

function getHandleAtPosition(room, x_ft, y_ft) {
    const handles = room.getHandles();
    const tolerance = 0.5; // feet
    
    for (const [name, handle] of Object.entries(handles)) {
        const dx = Math.abs(handle.x - x_ft);
        const dy = Math.abs(handle.y - y_ft);
        if (dx < tolerance && dy < tolerance) {
            return name;
        }
    }
    return null;
}

function resizeRoom(room, handle, x_ft, y_ft) {
    const minSize = 1; // minimum 1 foot
    
    switch (handle) {
        case 'topLeft':
            const newWidth1 = room.position.y_ft + room.dimensions.width_ft - y_ft;
            const newLength1 = room.position.x_ft + room.dimensions.length_ft - x_ft;
            if (newWidth1 >= minSize && newLength1 >= minSize) {
                room.dimensions.width_ft = newWidth1;
                room.dimensions.length_ft = newLength1;
                room.position.y_ft = y_ft;
                room.position.x_ft = x_ft;
            }
            break;
        case 'topRight':
            const newWidth2 = room.position.y_ft + room.dimensions.width_ft - y_ft;
            const newLength2 = x_ft - room.position.x_ft;
            if (newWidth2 >= minSize && newLength2 >= minSize) {
                room.dimensions.width_ft = newWidth2;
                room.dimensions.length_ft = newLength2;
                room.position.y_ft = y_ft;
            }
            break;
        case 'bottomLeft':
            const newWidth3 = y_ft - room.position.y_ft;
            const newLength3 = room.position.x_ft + room.dimensions.length_ft - x_ft;
            if (newWidth3 >= minSize && newLength3 >= minSize) {
                room.dimensions.width_ft = newWidth3;
                room.dimensions.length_ft = newLength3;
                room.position.x_ft = x_ft;
            }
            break;
        case 'bottomRight':
            const newWidth4 = y_ft - room.position.y_ft;
            const newLength4 = x_ft - room.position.x_ft;
            if (newWidth4 >= minSize && newLength4 >= minSize) {
                room.dimensions.width_ft = newWidth4;
                room.dimensions.length_ft = newLength4;
            }
            break;
    }
    
    // Round to 1 decimal
    room.position.x_ft = parseFloat(room.position.x_ft.toFixed(1));
    room.position.y_ft = parseFloat(room.position.y_ft.toFixed(1));
    room.dimensions.length_ft = parseFloat(room.dimensions.length_ft.toFixed(1));
    room.dimensions.width_ft = parseFloat(room.dimensions.width_ft.toFixed(1));
}

function updateCursor(mouseX, mouseY) {
    const { x_ft, y_ft } = screenToFeet(mouseX, mouseY);
    
    if (state.selectedRoom) {
        const handle = getHandleAtPosition(state.selectedRoom, x_ft, y_ft);
        if (handle) {
            const cursors = {
                topLeft: 'nwse-resize',
                topRight: 'nesw-resize',
                bottomLeft: 'nesw-resize',
                bottomRight: 'nwse-resize'
            };
            canvas.style.cursor = cursors[handle];
            return;
        }
    }
    
    const room = getRoomAtPosition(x_ft, y_ft);
    canvas.style.cursor = room ? 'move' : 'crosshair';
}

// ===========================
// UI UPDATES
// ===========================

function updatePropertiesPanel() {
    const placeholder = document.getElementById('propertiesContent');
    const form = document.getElementById('propertiesForm');
    
    if (state.selectedRoom) {
        placeholder.style.display = 'none';
        form.style.display = 'flex';
        
        document.getElementById('roomName').value = state.selectedRoom.name;
        document.getElementById('roomType').value = state.selectedRoom.type;
        document.getElementById('roomX').value = state.selectedRoom.position.x_ft.toFixed(1);
        document.getElementById('roomY').value = state.selectedRoom.position.y_ft.toFixed(1);
        document.getElementById('roomLength').value = state.selectedRoom.dimensions.length_ft.toFixed(1);
        document.getElementById('roomWidth').value = state.selectedRoom.dimensions.width_ft.toFixed(1);
        document.getElementById('roomArea').textContent = `${state.selectedRoom.getArea().toFixed(0)} sqft`;
    } else {
        placeholder.style.display = 'block';
        form.style.display = 'none';
    }
}

function updateSummary() {
    const plotArea = state.plotLength * state.plotWidth;
    const builtUpArea = state.rooms.reduce((sum, room) => sum + room.getArea(), 0);
    const coverage = plotArea > 0 ? (builtUpArea / plotArea * 100) : 0;
    
    document.getElementById('plotArea').textContent = `${plotArea} sqft`;
    document.getElementById('builtUpArea').textContent = `${builtUpArea.toFixed(0)} sqft`;
    document.getElementById('coverage').textContent = `${coverage.toFixed(1)}%`;
    document.getElementById('roomCount').textContent = state.rooms.length;
}

// ===========================
// PROPERTIES PANEL LISTENERS
// ===========================

document.getElementById('roomName').addEventListener('input', (e) => {
    if (state.selectedRoom) {
        state.selectedRoom.name = e.target.value;
        render();
    }
});

document.getElementById('roomType').addEventListener('change', (e) => {
    if (state.selectedRoom) {
        state.selectedRoom.type = e.target.value;
        render();
    }
});

document.getElementById('roomX').addEventListener('input', (e) => {
    if (state.selectedRoom) {
        state.selectedRoom.position.x_ft = parseFloat(e.target.value) || 0;
        render();
    }
});

document.getElementById('roomY').addEventListener('input', (e) => {
    if (state.selectedRoom) {
        state.selectedRoom.position.y_ft = parseFloat(e.target.value) || 0;
        render();
    }
});

document.getElementById('roomLength').addEventListener('input', (e) => {
    if (state.selectedRoom) {
        state.selectedRoom.dimensions.length_ft = parseFloat(e.target.value) || 1;
        document.getElementById('roomArea').textContent = `${state.selectedRoom.getArea().toFixed(0)} sqft`;
        updateSummary();
        render();
    }
});

document.getElementById('roomWidth').addEventListener('input', (e) => {
    if (state.selectedRoom) {
        state.selectedRoom.dimensions.width_ft = parseFloat(e.target.value) || 1;
        document.getElementById('roomArea').textContent = `${state.selectedRoom.getArea().toFixed(0)} sqft`;
        updateSummary();
        render();
    }
});

document.getElementById('deleteRoomBtn').addEventListener('click', () => {
    if (state.selectedRoom) {
        state.rooms = state.rooms.filter(room => room !== state.selectedRoom);
        state.selectedRoom = null;
        updatePropertiesPanel();
        updateSummary();
        render();
    }
});

// ===========================
// PLOT SIZE LISTENERS
// ===========================

document.getElementById('plotLength').addEventListener('input', (e) => {
    state.plotLength = parseFloat(e.target.value) || 10;
    updateSummary();
    render();
});

document.getElementById('plotWidth').addEventListener('input', (e) => {
    state.plotWidth = parseFloat(e.target.value) || 10;
    updateSummary();
    render();
});

// ===========================
// ZOOM CONTROLS
// ===========================

document.getElementById('zoomIn').addEventListener('click', () => {
    state.zoom = Math.min(state.zoom * 1.2, 5);
    render();
});

document.getElementById('zoomOut').addEventListener('click', () => {
    state.zoom = Math.max(state.zoom / 1.2, 0.3);
    render();
});

document.getElementById('fitView').addEventListener('click', () => {
    const padding = 100;
    const availableWidth = canvas.width - padding * 2;
    const availableHeight = canvas.height - padding * 2;
    
    const scaleX = availableWidth / (state.plotLength * state.scale);
    const scaleY = availableHeight / (state.plotWidth * state.scale);
    
    state.zoom = Math.min(scaleX, scaleY, 2);
    state.offsetX = padding;
    state.offsetY = padding;
    
    render();
});

// ===========================
// EXPORT JSON
// ===========================

document.getElementById('exportBtn').addEventListener('click', () => {
    const data = {
        rooms: state.rooms.map(room => ({
            name: room.name,
            type: room.type,
            position: {
                x_ft: room.position.x_ft,
                y_ft: room.position.y_ft
            },
            dimensions: {
                length_ft: room.dimensions.length_ft,
                width_ft: room.dimensions.width_ft
            }
        })),
        summary: {
            plot_length_ft: state.plotLength,
            plot_width_ft: state.plotWidth,
            total_built_up_area_sqft: state.rooms.reduce((sum, room) => sum + room.getArea(), 0),
            total_plot_area_sqft: state.plotLength * state.plotWidth
        }
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'floor-plan.json';
    a.click();
    
    URL.revokeObjectURL(url);
});

// ===========================
// IMPORT JSON
// ===========================

document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('fileInput').click();
});

document.getElementById('fileInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            
            // Set plot dimensions
            state.plotLength = data.summary.plot_length_ft;
            state.plotWidth = data.summary.plot_width_ft;
            
            document.getElementById('plotLength').value = state.plotLength;
            document.getElementById('plotWidth').value = state.plotWidth;
            
            // Load rooms
            state.rooms = data.rooms.map(roomData => 
                new Room(
                    roomData.name,
                    roomData.type,
                    roomData.position.x_ft,
                    roomData.position.y_ft,
                    roomData.dimensions.length_ft,
                    roomData.dimensions.width_ft
                )
            );
            
            state.selectedRoom = null;
            updatePropertiesPanel();
            updateSummary();
            render();
            
            alert('Floor plan loaded successfully!');
        } catch (error) {
            alert('Error loading file: ' + error.message);
        }
    };
    
    reader.readAsText(file);
    e.target.value = ''; // Reset input
});

// ===========================
// KEYBOARD SHORTCUTS
// ===========================

document.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' && state.selectedRoom) {
        state.rooms = state.rooms.filter(room => room !== state.selectedRoom);
        state.selectedRoom = null;
        updatePropertiesPanel();
        updateSummary();
        render();
    }
    
    if (e.key === 'Escape') {
        state.selectedRoom = null;
        updatePropertiesPanel();
        render();
    }
});

// ===========================
// INITIALIZATION
// ===========================

updateSummary();
render();
