// ===========================
// ROOMS.JS - Room Management (Polygon-based)
// ===========================

// Override the drawRoom function from canvas.js
function drawRoom(room, isSelected) {
    const fillColor = getRoomColor(room.type);
    const strokeColor = isSelected ? '#e74c3c' : '#34495e';
    const lineWidth = isSelected ? 3 : 1.5;
    
    // Draw room polygon
    drawPolygon(room.polygon, fillColor, strokeColor, lineWidth);
    
    // Draw room label
    const bounds = getPolygonBounds(room.polygon);
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    
    const { ctx } = getCanvas();
    const center = feetToScreen(centerX, centerY);
    
    ctx.fillStyle = '#2c3e50';
    ctx.font = isSelected ? 'bold 13px sans-serif' : '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(room.name, center.screenX, center.screenY - 8);
    
    // Show area
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#7f8c8d';
    const area = calculatePolygonArea(room.polygon);
    ctx.fillText(`${formatArea(area)}`, center.screenX, center.screenY + 8);
    
    // Draw vertices if selected
    if (isSelected) {
        room.polygon.forEach(point => {
            drawPoint(point, '#e74c3c', 5);
        });
    }
}

// Override drawTempRoom from canvas.js
function drawTempRoom() {
    const state = getState();
    const { ctx } = getCanvas();
    
    if (state.drawingPoints.length === 0) return;
    
    // Draw completed segments
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    const first = feetToScreen(state.drawingPoints[0].x_ft, state.drawingPoints[0].y_ft);
    ctx.moveTo(first.screenX, first.screenY);
    
    for (let i = 1; i < state.drawingPoints.length; i++) {
        const point = feetToScreen(state.drawingPoints[i].x_ft, state.drawingPoints[i].y_ft);
        ctx.lineTo(point.screenX, point.screenY);
    }
    
    // Draw line to current mouse position
    if (state.currentMousePos) {
        const current = feetToScreen(state.currentMousePos.x_ft, state.currentMousePos.y_ft);
        ctx.lineTo(current.screenX, current.screenY);
    }
    
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw vertices
    state.drawingPoints.forEach((point, index) => {
        drawPoint(point, index === 0 ? '#e74c3c' : '#3498db', 6);
    });
    
    // Show hint
    if (state.drawingPoints.length >= 2) {
        ctx.fillStyle = '#2c3e50';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        const lastPoint = feetToScreen(
            state.drawingPoints[state.drawingPoints.length - 1].x_ft,
            state.drawingPoints[state.drawingPoints.length - 1].y_ft
        );
        ctx.fillText('Double-click or press Enter to finish', lastPoint.screenX, lastPoint.screenY - 20);
    }
}

// ===========================
// ROOM INTERACTION
// ===========================

function handleRoomMouseDown(x_ft, y_ft) {
    const state = getState();
    
    if (state.activeTool === 'room') {
        // Add point to polygon
        state.drawingPoints.push({ x_ft, y_ft });
        render();
        return true;
    }
    
    return false;
}

function handleRoomMouseMove(x_ft, y_ft) {
    const state = getState();
    
    if (state.activeTool === 'room') {
        state.currentMousePos = { x_ft, y_ft };
        render();
    }
}

function handleRoomDoubleClick() {
    const state = getState();
    
    if (state.activeTool === 'room' && state.drawingPoints.length >= 3) {
        finishRoom();
        return true;
    }
    
    return false;
}

function handleRoomKeyPress(key) {
    const state = getState();
    
    if (state.activeTool === 'room') {
        if (key === 'Enter' && state.drawingPoints.length >= 3) {
            finishRoom();
            return true;
        }
        if (key === 'Escape') {
            cancelRoomDrawing();
            return true;
        }
    }
    
    return false;
}

function finishRoom() {
    const state = getState();
    
    if (state.drawingPoints.length < 3) return;
    
    // Create room
    const roomCount = state.rooms.length + 1;
    const room = {
        id: generateId(),
        name: `Room ${roomCount}`,
        type: 'bedroom',
        polygon: [...state.drawingPoints]
    };
    
    addRoom(room);
    
    // Reset drawing state
    state.drawingPoints = [];
    state.currentMousePos = null;
    
    // Select the new room
    selectElement('room', room);
    
    render();
    updateUI();
    updateUndoRedoButtons();
    showToast(`Room "${room.name}" created`, 'success', 2000);
}

function cancelRoomDrawing() {
    const state = getState();
    state.drawingPoints = [];
    state.currentMousePos = null;
    render();
}

// ===========================
// ROOM SELECTION
// ===========================

function findRoomAtPoint(x_ft, y_ft) {
    const state = getState();
    
    // Check from top to bottom (last drawn on top)
    for (let i = state.rooms.length - 1; i >= 0; i--) {
        const room = state.rooms[i];
        if (pointInPolygon({ x_ft, y_ft }, room.polygon)) {
            return room;
        }
    }
    
    return null;
}

// ===========================
// ROOM EDITING
// ===========================

function updateRoomProperty(room, property, value) {
    if (property === 'name') {
        room.name = value;
    } else if (property === 'type') {
        room.type = value;
    }
    render();
}

function moveRoom(room, deltaX_ft, deltaY_ft) {
    room.polygon.forEach(point => {
        point.x_ft += deltaX_ft;
        point.y_ft += deltaY_ft;
    });
}

function deleteRoom(room) {
    removeElement('room', room);
    clearSelection();
    render();
    updateUI();
}

// ===========================
// ROOM PROPERTIES PANEL
// ===========================

function showRoomProperties(room) {
    const area = calculatePolygonArea(room.polygon);
    const bounds = getPolygonBounds(room.polygon);
    
    const html = `
        <div class="property-section">
            <div class="form-group">
                <label for="roomName">Name:</label>
                <input type="text" id="roomName" value="${room.name}" onchange="updateRoomName(this.value)">
            </div>
            <div class="form-group">
                <label for="roomType">Type:</label>
                <select id="roomType" onchange="updateRoomType(this.value)">
                    <option value="bedroom" ${room.type === 'bedroom' ? 'selected' : ''}>Bedroom</option>
                    <option value="bathroom" ${room.type === 'bathroom' ? 'selected' : ''}>Bathroom</option>
                    <option value="kitchen" ${room.type === 'kitchen' ? 'selected' : ''}>Kitchen</option>
                    <option value="living_room" ${room.type === 'living_room' ? 'selected' : ''}>Living Room</option>
                    <option value="dining" ${room.type === 'dining' ? 'selected' : ''}>Dining</option>
                    <option value="hallway" ${room.type === 'hallway' ? 'selected' : ''}>Hallway</option>
                    <option value="pooja_room" ${room.type === 'pooja_room' ? 'selected' : ''}>Pooja Room</option>
                    <option value="utility" ${room.type === 'utility' ? 'selected' : ''}>Utility</option>
                    <option value="storage" ${room.type === 'storage' ? 'selected' : ''}>Storage</option>
                    <option value="entry" ${room.type === 'entry' ? 'selected' : ''}>Entry</option>
                </select>
            </div>
        </div>
        <div class="property-section">
            <div class="form-group">
                <label>Area:</label>
                <div class="readonly-value">${formatArea(area)}</div>
            </div>
            <div class="form-group">
                <label>Vertices:</label>
                <div class="readonly-value">${room.polygon.length} points</div>
            </div>
            <div class="form-group">
                <label>Bounds:</label>
                <div class="readonly-value" style="font-size: 11px;">
                    X: ${bounds.minX.toFixed(1)} to ${bounds.maxX.toFixed(1)}<br>
                    Y: ${bounds.minY.toFixed(1)} to ${bounds.maxY.toFixed(1)}
                </div>
            </div>
        </div>
        <div class="property-section">
            <button class="btn btn-danger" onclick="deleteSelectedRoom()">Delete Room</button>
        </div>
    `;
    
    document.getElementById('propertiesContent').innerHTML = html;
}

// Global functions for inline event handlers
window.updateRoomName = function(name) {
    const state = getState();
    if (state.selectedElement && state.selectedType === 'room') {
        updateRoomProperty(state.selectedElement, 'name', name);
        updateUI();
    }
};

window.updateRoomType = function(type) {
    const state = getState();
    if (state.selectedElement && state.selectedType === 'room') {
        updateRoomProperty(state.selectedElement, 'type', type);
        updateUI();
    }
};

window.deleteSelectedRoom = function() {
    const state = getState();
    if (state.selectedElement && state.selectedType === 'room') {
        showConfirm(
            `Are you sure you want to delete room "${state.selectedElement.name}"?`,
            () => {
                deleteRoom(state.selectedElement);
                updateUndoRedoButtons();
                showToast('Room deleted', 'success', 2000);
            }
        );
    }
};
