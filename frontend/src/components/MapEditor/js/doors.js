// ===========================
// DOORS.JS - Door Management
// ===========================

// Override drawDoor from canvas.js
function drawDoor(door, isSelected) {
    const { ctx } = getCanvas();
    const state = getState();
    
    // Draw door opening (gap in wall)
    const p = feetToScreen(door.position.x_ft, door.position.y_ft);
    const widthPx = door.width_ft * state.scale * state.zoom;
    
    // Draw door arc for swing
    ctx.strokeStyle = isSelected ? '#e74c3c' : '#8e44ad';
    ctx.lineWidth = isSelected ? 2 : 1.5;
    
    // Determine swing direction
    let startAngle = 0;
    if (door.swing === 'in-left') startAngle = 0;
    else if (door.swing === 'in-right') startAngle = Math.PI / 2;
    else if (door.swing === 'out-left') startAngle = Math.PI;
    else if (door.swing === 'out-right') startAngle = -Math.PI / 2;
    
    ctx.beginPath();
    ctx.arc(p.screenX, p.screenY, widthPx, startAngle, startAngle + Math.PI / 2);
    ctx.stroke();
    
    // Draw door line
    ctx.beginPath();
    ctx.moveTo(p.screenX, p.screenY);
    const endX = p.screenX + widthPx * Math.cos(startAngle + Math.PI / 2);
    const endY = p.screenY + widthPx * Math.sin(startAngle + Math.PI / 2);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    // Draw center point
    if (isSelected) {
        drawPoint(door.position, '#e74c3c', 5);
    }
}

// Handle door placement
function handleDoorClick(x_ft, y_ft) {
    const wall = findNearestWall({ x_ft, y_ft }, 0.5);
    
    if (wall) {
        const nearestPoint = nearestPointOnWall({ x_ft, y_ft }, wall);
        
        const door = {
            id: generateId(),
            position: nearestPoint,
            width_ft: 3.0,
            swing: 'in-right'
        };
        
        addDoor(door);
        selectElement('door', door);
        render();
        updateUI();
        updateUndoRedoButtons();
        showToast('Door added', 'success', 2000);
        return true;
    }
    
    return false;
}

function showDoorProperties(door) {
    const html = `
        <div class="property-section">
            <div class="form-group">
                <label for="doorWidth">Width (ft):</label>
                <input type="number" id="doorWidth" value="${door.width_ft}" 
                       step="0.5" min="2" max="6" onchange="updateDoorWidth(this.value)">
            </div>
            <div class="form-group">
                <label>Swing Direction:</label>
                <div class="swing-picker">
                    <div class="swing-option ${door.swing === 'in-left' ? 'selected' : ''}" 
                         onclick="updateDoorSwing('in-left')">In-Left</div>
                    <div class="swing-option ${door.swing === 'in-right' ? 'selected' : ''}" 
                         onclick="updateDoorSwing('in-right')">In-Right</div>
                    <div class="swing-option ${door.swing === 'out-left' ? 'selected' : ''}" 
                         onclick="updateDoorSwing('out-left')">Out-Left</div>
                    <div class="swing-option ${door.swing === 'out-right' ? 'selected' : ''}" 
                         onclick="updateDoorSwing('out-right')">Out-Right</div>
                </div>
            </div>
        </div>
        <div class="property-section">
            <button class="btn btn-danger" onclick="deleteSelectedDoor()">Delete Door</button>
        </div>
    `;
    document.getElementById('propertiesContent').innerHTML = html;
}

window.updateDoorWidth = function(width) {
    const state = getState();
    if (state.selectedElement && state.selectedType === 'door') {
        state.selectedElement.width_ft = parseFloat(width);
        render();
    }
};

window.updateDoorSwing = function(swing) {
    const state = getState();
    if (state.selectedElement && state.selectedType === 'door') {
        state.selectedElement.swing = swing;
        render();
        showDoorProperties(state.selectedElement);
    }
};

window.deleteSelectedDoor = function() {
    const state = getState();
    if (state.selectedElement && state.selectedType === 'door') {
        removeElement('door', state.selectedElement);
        clearSelection();
        render();
        updateUI();
    }
};

function findDoorAtPoint(x_ft, y_ft) {
    const state = getState();
    for (let i = state.doors.length - 1; i >= 0; i--) {
        const door = state.doors[i];
        const dist = distance({ x_ft, y_ft }, door.position);
        if (dist < 0.5) return door;
    }
    return null;
}
