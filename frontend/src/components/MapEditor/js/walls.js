// ===========================
// WALLS.JS - Wall Management
// ===========================

// Override drawWall from canvas.js
function drawWall(wall, isSelected) {
    const state = getState();
    const { ctx } = getCanvas();
    
    // Calculate wall thickness in screen pixels
    const thicknessPx = wall.thickness_ft * state.scale * state.zoom;
    
    // Get screen coordinates
    const p1 = feetToScreen(wall.start.x_ft, wall.start.y_ft);
    const p2 = feetToScreen(wall.end.x_ft, wall.end.y_ft);
    
    // Calculate perpendicular offset for thickness
    const dx = p2.screenX - p1.screenX;
    const dy = p2.screenY - p1.screenY;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    if (len === 0) return;
    
    const perpX = -dy / len * thicknessPx / 2;
    const perpY = dx / len * thicknessPx / 2;
    
    // Draw wall as filled rectangle
    ctx.fillStyle = isSelected ? 'rgba(231, 76, 60, 0.3)' : 'rgba(44, 62, 80, 0.8)';
    ctx.beginPath();
    ctx.moveTo(p1.screenX + perpX, p1.screenY + perpY);
    ctx.lineTo(p2.screenX + perpX, p2.screenY + perpY);
    ctx.lineTo(p2.screenX - perpX, p2.screenY - perpY);
    ctx.lineTo(p1.screenX - perpX, p1.screenY - perpY);
    ctx.closePath();
    ctx.fill();
    
    // Draw outline
    ctx.strokeStyle = isSelected ? '#e74c3c' : '#2c3e50';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.stroke();
    
    // Draw endpoints if selected
    if (isSelected) {
        drawPoint(wall.start, '#e74c3c', 6);
        drawPoint(wall.end, '#e74c3c', 6);
        
        // Show length
        const midX = (wall.start.x_ft + wall.end.x_ft) / 2;
        const midY = (wall.start.y_ft + wall.end.y_ft) / 2;
        const length = distance(wall.start, wall.end);
        drawText(formatFeet(length), { x_ft: midX, y_ft: midY }, '#e74c3c', 'bold 11px sans-serif');
    }
}

// Override drawTempWall from canvas.js
function drawTempWall() {
    const state = getState();
    if (!state.tempStart || !state.currentMousePos) return;
    
    const { ctx } = getCanvas();
    
    // Draw temporary line
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    
    const p1 = feetToScreen(state.tempStart.x_ft, state.tempStart.y_ft);
    const p2 = feetToScreen(state.currentMousePos.x_ft, state.currentMousePos.y_ft);
    
    ctx.beginPath();
    ctx.moveTo(p1.screenX, p1.screenY);
    ctx.lineTo(p2.screenX, p2.screenY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw start point
    drawPoint(state.tempStart, '#e74c3c', 6);
    
    // Show length
    const length = distance(state.tempStart, state.currentMousePos);
    ctx.fillStyle = '#2c3e50';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(formatFeet(length), (p1.screenX + p2.screenX) / 2, (p1.screenY + p2.screenY) / 2 - 10);
}

// ===========================
// WALL INTERACTION
// ===========================

function handleWallMouseDown(x_ft, y_ft) {
    const state = getState();
    
    if (state.activeTool === 'wall') {
        if (!state.tempStart) {
            // First click - set start point
            state.tempStart = { x_ft, y_ft };
        } else {
            // Second click - create wall
            finishWall(x_ft, y_ft);
        }
        render();
        return true;
    }
    
    return false;
}

function handleWallMouseMove(x_ft, y_ft) {
    const state = getState();
    
    if (state.activeTool === 'wall' && state.tempStart) {
        state.currentMousePos = { x_ft, y_ft };
        render();
    }
}

function handleWallKeyPress(key) {
    const state = getState();
    
    if (state.activeTool === 'wall') {
        if (key === 'Escape') {
            cancelWallDrawing();
            return true;
        }
    }
    
    return false;
}

function finishWall(endX, endY) {
    const state = getState();
    
    if (!state.tempStart) return;
    
    const length = distance(state.tempStart, { x_ft: endX, y_ft: endY });
    if (length < 0.5) {
        // Too short, cancel
        cancelWallDrawing();
        return;
    }
    
    // Determine wall thickness (outer walls are thicker)
    const isOuterWall = isNearPlotBoundary(state.tempStart) || isNearPlotBoundary({ x_ft: endX, y_ft: endY });
    const thickness = isOuterWall ? 0.75 : 0.5;
    
    // Create wall
    const wall = {
        id: generateId(),
        start: { ...state.tempStart },
        end: { x_ft: endX, y_ft: endY },
        thickness_ft: thickness
    };
    
    addWall(wall);
    
    // Reset for next wall (start where we ended)
    state.tempStart = { x_ft: endX, y_ft: endY };
    state.currentMousePos = null;
    
    render();
    updateUI();
    updateUndoRedoButtons();
    showToast('Wall created', 'success', 2000);
}

function cancelWallDrawing() {
    const state = getState();
    state.tempStart = null;
    state.currentMousePos = null;
    render();
}

function isNearPlotBoundary(point, tolerance = 1.0) {
    const state = getState();
    const plot = state.plotSummary;
    
    return (
        Math.abs(point.x_ft) < tolerance ||
        Math.abs(point.y_ft) < tolerance ||
        Math.abs(point.x_ft - plot.plot_length_ft) < tolerance ||
        Math.abs(point.y_ft - plot.plot_width_ft) < tolerance
    );
}

// ===========================
// WALL SELECTION
// ===========================

function findWallAtPoint(x_ft, y_ft, tolerance = 0.5) {
    const state = getState();
    
    for (let i = state.walls.length - 1; i >= 0; i--) {
        const wall = state.walls[i];
        const dist = distanceToLine({ x_ft, y_ft }, wall.start, wall.end);
        if (dist < tolerance) {
            return wall;
        }
    }
    
    return null;
}

// ===========================
// WALL EDITING
// ===========================

function updateWallThickness(wall, thickness) {
    wall.thickness_ft = Math.max(0.25, Math.min(2.0, thickness));
    render();
}

function deleteWall(wall) {
    removeElement('wall', wall);
    clearSelection();
    render();
    updateUI();
}

// ===========================
// WALL PROPERTIES PANEL
// ===========================

function showWallProperties(wall) {
    const length = distance(wall.start, wall.end);
    
    const html = `
        <div class="property-section">
            <div class="form-group">
                <label for="wallThickness">Thickness (ft):</label>
                <input type="number" id="wallThickness" value="${wall.thickness_ft}" 
                       step="0.25" min="0.25" max="2" onchange="updateWallThickness(this.value)">
            </div>
            <div class="form-group">
                <label>Length:</label>
                <div class="readonly-value">${formatFeet(length)}</div>
            </div>
        </div>
        <div class="property-section">
            <div class="form-group">
                <label>Start Point:</label>
                <div class="readonly-value" style="font-size: 11px;">
                    X: ${wall.start.x_ft.toFixed(1)} ft<br>
                    Y: ${wall.start.y_ft.toFixed(1)} ft
                </div>
            </div>
            <div class="form-group">
                <label>End Point:</label>
                <div class="readonly-value" style="font-size: 11px;">
                    X: ${wall.end.x_ft.toFixed(1)} ft<br>
                    Y: ${wall.end.y_ft.toFixed(1)} ft
                </div>
            </div>
        </div>
        <div class="property-section">
            <button class="btn btn-danger" onclick="deleteSelectedWall()">Delete Wall</button>
        </div>
    `;
    
    document.getElementById('propertiesContent').innerHTML = html;
}

// Global functions for inline event handlers
window.updateWallThickness = function(thickness) {
    const state = getState();
    if (state.selectedElement && state.selectedType === 'wall') {
        updateWallThickness(state.selectedElement, parseFloat(thickness));
        updateUI();
    }
};

window.deleteSelectedWall = function() {
    const state = getState();
    if (state.selectedElement && state.selectedType === 'wall') {
        showConfirm(
            'Are you sure you want to delete this wall?',
            () => {
                deleteWall(state.selectedElement);
                updateUndoRedoButtons();
                showToast('Wall deleted', 'success', 2000);
            }
        );
    }
};
