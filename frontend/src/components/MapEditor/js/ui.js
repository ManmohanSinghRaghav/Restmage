// ===========================
// UI.JS - User Interface Controller
// ===========================

function initUI() {
    // Tool buttons
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tool = btn.dataset.tool;
            setActiveTool(tool);
            updateToolButtons();
            updateCursor();
            
            // Show/hide fixture palette
            if (tool === 'fixture') {
                showFixturePalette();
            } else {
                hideFixturePalette();
            }
        });
    });
    
    // Undo/Redo buttons
    document.getElementById('undoBtn').addEventListener('click', () => {
        undo();
        updateUndoRedoButtons();
        render();
        updateElementsList();
        showToast('Undo successful', 'info', 2000);
    });
    
    document.getElementById('redoBtn').addEventListener('click', () => {
        redo();
        updateUndoRedoButtons();
        render();
        updateElementsList();
        showToast('Redo successful', 'info', 2000);
    });
    
    // Zoom controls
    document.getElementById('zoomIn').addEventListener('click', zoomIn);
    document.getElementById('zoomOut').addEventListener('click', zoomOut);
    document.getElementById('fitView').addEventListener('click', fitToView);
    
    // Scale controls
    document.getElementById('scaleIncrease').addEventListener('click', () => {
        const input = document.getElementById('canvasScale');
        const currentScale = parseFloat(input.value) || 10;
        input.value = Math.min(30, currentScale + 1);
        updateCanvasScale();
    });
    
    document.getElementById('scaleDecrease').addEventListener('click', () => {
        const input = document.getElementById('canvasScale');
        const currentScale = parseFloat(input.value) || 10;
        input.value = Math.max(5, currentScale - 1);
        updateCanvasScale();
    });
    
    document.getElementById('canvasScale').addEventListener('input', updateCanvasScale);
    
    // Scale toggle (show/hide) - Sidebar
    document.getElementById('scaleToggle').addEventListener('click', toggleScaleSection);
    
    // Scale preset buttons - Sidebar
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const scale = parseInt(e.target.dataset.scale);
            setScalePreset(scale);
        });
    });
    
    // Floating scale control toggle
    document.getElementById('floatingScaleToggle').addEventListener('click', toggleFloatingScale);
    
    // Scale slider
    const scaleSlider = document.getElementById('scaleSlider');
    scaleSlider.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        document.getElementById('sliderValue').textContent = value;
        updateScaleFromSlider(value);
    });
    
    // Quick scale buttons
    document.querySelectorAll('.quick-scale-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const scale = parseInt(e.target.dataset.scale);
            scaleSlider.value = scale;
            document.getElementById('sliderValue').textContent = scale;
            updateScaleFromSlider(scale);
        });
    });
    
    // Plot inputs
    document.getElementById('plotLength').addEventListener('input', (e) => {
        const state = getState();
        state.plotSummary.plot_length_ft = parseFloat(e.target.value) || 50;
        render();
        updateSummary();
    });
    
    document.getElementById('plotWidth').addEventListener('input', (e) => {
        const state = getState();
        state.plotSummary.plot_width_ft = parseFloat(e.target.value) || 30;
        render();
        updateSummary();
    });
    
    // Setback inputs
    ['Front', 'Rear', 'Left', 'Right'].forEach(side => {
        const input = document.getElementById(`setback${side}`);
        input.addEventListener('input', (e) => {
            const state = getState();
            state.plotSummary[`setback_${side.toLowerCase()}_ft`] = parseFloat(e.target.value) || 0;
            render();
        });
    });
    
    // Map info inputs
    ['Title', 'Author', 'Date', 'Scale'].forEach(field => {
        const input = document.getElementById(`map${field}`);
        input.addEventListener('input', (e) => {
            const state = getState();
            state.mapInfo[field.toLowerCase()] = e.target.value;
        });
    });
    
    // Set default date
    document.getElementById('mapDate').valueAsDate = new Date();
    
    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateElementsList(btn.dataset.tab);
        });
    });
    
    updateSummary();
}

function updateToolButtons() {
    const state = getState();
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === state.activeTool);
    });
}

function updateCursor() {
    const state = getState();
    const canvas = document.getElementById('floorCanvas');
    const cursorClass = `cursor-${state.activeTool}`;
    canvas.className = cursorClass;
}

function updateUI() {
    updateSummary();
    updatePropertiesPanel();
    updateElementsList();
}

function updateSummary() {
    const state = getState();
    const counts = getCounts();
    const plotArea = getPlotArea();
    const builtUpArea = getTotalBuiltUpArea();
    const coverage = plotArea > 0 ? (builtUpArea / plotArea * 100) : 0;
    
    document.getElementById('plotArea').textContent = formatArea(plotArea);
    document.getElementById('builtUpArea').textContent = formatArea(builtUpArea);
    document.getElementById('coverage').textContent = formatPercentage(coverage);
    document.getElementById('roomCount').textContent = counts.rooms;
    document.getElementById('wallCount').textContent = counts.walls;
    document.getElementById('doorCount').textContent = counts.doors;
    document.getElementById('windowCount').textContent = counts.windows;
    document.getElementById('fixtureCount').textContent = counts.fixtures;
}

function updatePropertiesPanel() {
    const state = getState();
    
    if (!state.selectedElement || !state.selectedType) {
        document.getElementById('propertiesContent').innerHTML = '<p class="placeholder">Select an element to edit</p>';
        return;
    }
    
    // Call the appropriate properties function
    switch (state.selectedType) {
        case 'room':
            showRoomProperties(state.selectedElement);
            break;
        case 'wall':
            showWallProperties(state.selectedElement);
            break;
        case 'door':
            showDoorProperties(state.selectedElement);
            break;
        case 'window':
            showWindowProperties(state.selectedElement);
            break;
        case 'fixture':
            showFixtureProperties(state.selectedElement);
            break;
    }
}

function updateElementsList(tab) {
    const state = getState();
    const activeTab = tab || document.querySelector('.tab-btn.active').dataset.tab;
    const container = document.getElementById('elementsContent');
    
    let elements = [];
    let type = '';
    
    switch (activeTab) {
        case 'rooms':
            elements = state.rooms;
            type = 'room';
            break;
        case 'walls':
            elements = state.walls;
            type = 'wall';
            break;
        case 'openings':
            elements = [...state.doors, ...state.windows];
            type = 'opening';
            break;
        case 'fixtures':
            elements = state.fixtures;
            type = 'fixture';
            break;
    }
    
    if (elements.length === 0) {
        container.innerHTML = '<p class="placeholder">No elements yet</p>';
        return;
    }
    
    const html = elements.map((el, index) => {
        const name = el.name || `${el.type || type} ${index + 1}`;
        const isSelected = el === state.selectedElement;
        
        return `
            <div class="element-item ${isSelected ? 'selected' : ''}" onclick="selectElementFromList('${type}', ${index})">
                <div>
                    <div class="element-name">${name}</div>
                    <div class="element-type">${el.type || type}</div>
                </div>
                <button class="element-delete" onclick="event.stopPropagation(); deleteElementFromList('${type}', ${index})">✕</button>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

window.selectElementFromList = function(type, index) {
    const state = getState();
    let element;
    
    switch (type) {
        case 'room':
            element = state.rooms[index];
            break;
        case 'wall':
            element = state.walls[index];
            break;
        case 'fixture':
            element = state.fixtures[index];
            break;
    }
    
    if (element) {
        selectElement(type, element);
        render();
        updateUI();
    }
};

window.deleteElementFromList = function(type, index) {
    const state = getState();
    const arrayName = type + 's';
    const element = state[arrayName][index];
    
    if (element) {
        showConfirm(
            `Are you sure you want to delete this ${type}?`,
            () => {
                removeElement(type, element);
                if (state.selectedElement === element) {
                    clearSelection();
                }
                render();
                updateUI();
                showToast(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted`, 'success', 2000);
            }
        );
    }
};

function zoomIn() {
    const state = getState();
    state.zoom = Math.min(state.zoom * 1.2, 5);
    render();
}

function zoomOut() {
    const state = getState();
    state.zoom = Math.max(state.zoom / 1.2, 0.3);
    render();
}

function fitToView() {
    const state = getState();
    const canvas = document.getElementById('floorCanvas');
    
    const padding = 80;
    const availableWidth = canvas.width - padding * 2;
    const availableHeight = canvas.height - padding * 2;
    
    const scaleX = availableWidth / (state.plotSummary.plot_length_ft * state.scale);
    const scaleY = availableHeight / (state.plotSummary.plot_width_ft * state.scale);
    
    state.zoom = Math.min(scaleX, scaleY, 2);
    state.offsetX = padding;
    state.offsetY = padding;
    
    render();
}

// Mouse coordinate display
function updateMouseCoordinates(x_ft, y_ft) {
    document.getElementById('canvasCoords').textContent = 
        `${x_ft.toFixed(1)}, ${y_ft.toFixed(1)} ft`;
}

// Update undo/redo button states
function updateUndoRedoButtons() {
    const state = getState();
    document.getElementById('undoBtn').disabled = state.historyIndex <= 0;
    document.getElementById('redoBtn').disabled = state.historyIndex >= state.history.length - 1;
}

// Update canvas scale
function updateCanvasScale() {
    const state = getState();
    const newScale = parseFloat(document.getElementById('canvasScale').value) || 10;
    state.scale = newScale;
    
    // Update all scale displays
    document.getElementById('scaleBadge').textContent = `${newScale} px/ft`;
    document.getElementById('floatingScaleValue').textContent = `${newScale} px/ft`;
    document.getElementById('scaleSlider').value = newScale;
    document.getElementById('sliderValue').textContent = newScale;
    
    // Update active preset button (sidebar)
    document.querySelectorAll('.preset-btn').forEach(btn => {
        const presetScale = parseInt(btn.dataset.scale);
        if (presetScale === newScale) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update active quick button (floating panel)
    document.querySelectorAll('.quick-scale-btn').forEach(btn => {
        const btnScale = parseInt(btn.dataset.scale);
        if (btnScale === newScale) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    render();
    showToast(`Canvas scale: ${newScale} px/ft`, 'success', 1500);
}

// Toggle scale section visibility
function toggleScaleSection() {
    const header = document.getElementById('scaleToggle');
    const content = document.getElementById('scaleContent');
    
    header.classList.toggle('collapsed');
    content.classList.toggle('hidden');
}

// Set scale from preset button
function setScalePreset(scale) {
    const input = document.getElementById('canvasScale');
    input.value = scale;
    updateCanvasScale();
}

// Toggle floating scale panel
function toggleFloatingScale() {
    const content = document.getElementById('floatingScaleContent');
    content.classList.toggle('hidden');
}

// Update scale from slider
function updateScaleFromSlider(value) {
    const state = getState();
    state.scale = value;
    
    // Update all scale displays
    document.getElementById('canvasScale').value = value;
    document.getElementById('scaleBadge').textContent = `${value} px/ft`;
    document.getElementById('floatingScaleValue').textContent = `${value} px/ft`;
    
    // Update active quick button
    document.querySelectorAll('.quick-scale-btn').forEach(btn => {
        const btnScale = parseInt(btn.dataset.scale);
        if (btnScale === value) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Update active preset button (sidebar)
    document.querySelectorAll('.preset-btn').forEach(btn => {
        const presetScale = parseInt(btn.dataset.scale);
        if (presetScale === value) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    render();
}

// Close floating scale panel when clicking outside
document.addEventListener('click', (e) => {
    const panel = document.getElementById('floatingScalePanel');
    const content = document.getElementById('floatingScaleContent');
    
    if (panel && !panel.contains(e.target) && !content.classList.contains('hidden')) {
        content.classList.add('hidden');
    }
});
