// ===========================
// WINDOWS.JS - Window Management
// ===========================

// Override drawWindow from canvas.js
function drawWindow(window, isSelected) {
    const { ctx } = getCanvas();
    const state = getState();
    
    const p = feetToScreen(window.position.x_ft, window.position.y_ft);
    const widthPx = window.width_ft * state.scale * state.zoom;
    
    // Draw window as double line
    ctx.strokeStyle = isSelected ? '#e74c3c' : '#3498db';
    ctx.lineWidth = isSelected ? 3 : 2;
    
    // Draw two parallel lines
    ctx.beginPath();
    ctx.moveTo(p.screenX - widthPx / 2, p.screenY - 3);
    ctx.lineTo(p.screenX + widthPx / 2, p.screenY - 3);
    ctx.moveTo(p.screenX - widthPx / 2, p.screenY + 3);
    ctx.lineTo(p.screenX + widthPx / 2, p.screenY + 3);
    ctx.stroke();
    
    // Draw center point if selected
    if (isSelected) {
        drawPoint(window.position, '#e74c3c', 5);
    }
}

// Handle window placement
function handleWindowClick(x_ft, y_ft) {
    const wall = findNearestWall({ x_ft, y_ft }, 0.5);
    
    if (wall) {
        const nearestPoint = nearestPointOnWall({ x_ft, y_ft }, wall);
        
        const window = {
            id: generateId(),
            position: nearestPoint,
            width_ft: 3.0
        };
        
        addWindow(window);
        selectElement('window', window);
        render();
        updateUI();
        updateUndoRedoButtons();
        showToast('Window added', 'success', 2000);
        return true;
    }
    
    return false;
}

function showWindowProperties(window) {
    const html = `
        <div class="property-section">
            <div class="form-group">
                <label for="windowWidth">Width (ft):</label>
                <input type="number" id="windowWidth" value="${window.width_ft}" 
                       step="0.5" min="1.5" max="6" onchange="updateWindowWidth(this.value)">
            </div>
            <div class="form-group">
                <label>Position:</label>
                <div class="readonly-value" style="font-size: 11px;">
                    X: ${window.position.x_ft.toFixed(1)} ft<br>
                    Y: ${window.position.y_ft.toFixed(1)} ft
                </div>
            </div>
        </div>
        <div class="property-section">
            <button class="btn btn-danger" onclick="deleteSelectedWindow()">Delete Window</button>
        </div>
    `;
    document.getElementById('propertiesContent').innerHTML = html;
}

window.updateWindowWidth = function(width) {
    const state = getState();
    if (state.selectedElement && state.selectedType === 'window') {
        state.selectedElement.width_ft = parseFloat(width);
        render();
    }
};

window.deleteSelectedWindow = function() {
    const state = getState();
    if (state.selectedElement && state.selectedType === 'window') {
        removeElement('window', state.selectedElement);
        clearSelection();
        render();
        updateUI();
    }
};

function findWindowAtPoint(x_ft, y_ft) {
    const state = getState();
    for (let i = state.windows.length - 1; i >= 0; i--) {
        const win = state.windows[i];
        const dist = distance({ x_ft, y_ft }, win.position);
        if (dist < 0.5) return win;
    }
    return null;
}
