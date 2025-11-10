// ===========================
// FIXTURES.JS - Fixture Management
// ===========================

const FIXTURE_TYPES = ['toilet', 'sink', 'kitchen_sink', 'stove', 'shower', 'bathtub'];

// Override drawFixture from canvas.js
function drawFixture(fixture, isSelected) {
    const { ctx } = getCanvas();
    const state = getState();
    
    const p = feetToScreen(fixture.position.x_ft, fixture.position.y_ft);
    const size = 1.5 * state.scale * state.zoom;
    
    // Save context
    ctx.save();
    ctx.translate(p.screenX, p.screenY);
    ctx.rotate((fixture.rotation * Math.PI) / 180);
    
    // Draw fixture icon
    ctx.font = `${size}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(getFixtureIcon(fixture.type), 0, 0);
    
    ctx.restore();
    
    // Draw selection circle
    if (isSelected) {
        ctx.strokeStyle = '#e74c3c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.screenX, p.screenY, size * 0.8, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// Handle fixture placement
function handleFixtureClick(x_ft, y_ft) {
    const state = getState();
    
    const fixture = {
        id: generateId(),
        position: { x_ft, y_ft },
        type: state.selectedFixtureType || 'toilet',
        rotation: 0
    };
    
    addFixture(fixture);
    selectElement('fixture', fixture);
    render();
    updateUI();
    updateUndoRedoButtons();
    showToast(`${fixture.type.replace('_', ' ')} added`, 'success', 2000);
    return true;
}

function showFixtureProperties(fixture) {
    const html = `
        <div class="property-section">
            <div class="form-group">
                <label for="fixtureType">Type:</label>
                <select id="fixtureType" onchange="updateFixtureType(this.value)">
                    ${FIXTURE_TYPES.map(type => `
                        <option value="${type}" ${fixture.type === type ? 'selected' : ''}>
                            ${getFixtureIcon(type)} ${type.replace('_', ' ')}
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="fixtureRotation">Rotation (°):</label>
                <input type="range" id="fixtureRotation" min="0" max="360" step="45" 
                       value="${fixture.rotation}" oninput="updateFixtureRotation(this.value)">
                <div class="readonly-value">${fixture.rotation}°</div>
            </div>
        </div>
        <div class="property-section">
            <div class="form-group">
                <label>Position:</label>
                <div class="form-row">
                    <input type="number" value="${fixture.position.x_ft.toFixed(1)}" 
                           step="0.5" onchange="updateFixtureX(this.value)">
                    <input type="number" value="${fixture.position.y_ft.toFixed(1)}" 
                           step="0.5" onchange="updateFixtureY(this.value)">
                </div>
            </div>
        </div>
        <div class="property-section">
            <button class="btn btn-danger" onclick="deleteSelectedFixture()">Delete Fixture</button>
        </div>
    `;
    document.getElementById('propertiesContent').innerHTML = html;
}

window.updateFixtureType = function(type) {
    const state = getState();
    if (state.selectedElement && state.selectedType === 'fixture') {
        state.selectedElement.type = type;
        render();
    }
};

window.updateFixtureRotation = function(rotation) {
    const state = getState();
    if (state.selectedElement && state.selectedType === 'fixture') {
        state.selectedElement.rotation = parseInt(rotation);
        render();
        showFixtureProperties(state.selectedElement);
    }
};

window.updateFixtureX = function(x) {
    const state = getState();
    if (state.selectedElement && state.selectedType === 'fixture') {
        state.selectedElement.position.x_ft = parseFloat(x);
        render();
    }
};

window.updateFixtureY = function(y) {
    const state = getState();
    if (state.selectedElement && state.selectedType === 'fixture') {
        state.selectedElement.position.y_ft = parseFloat(y);
        render();
    }
};

window.deleteSelectedFixture = function() {
    const state = getState();
    if (state.selectedElement && state.selectedType === 'fixture') {
        removeElement('fixture', state.selectedElement);
        clearSelection();
        render();
        updateUI();
    }
};

function findFixtureAtPoint(x_ft, y_ft) {
    const state = getState();
    for (let i = state.fixtures.length - 1; i >= 0; i--) {
        const fixture = state.fixtures[i];
        const dist = distance({ x_ft, y_ft }, fixture.position);
        if (dist < 1.0) return fixture;
    }
    return null;
}

// Show fixture palette
function showFixturePalette() {
    const paletteHTML = `
        <div class="fixture-palette active" id="fixturePalette">
            <h4>Select Fixture Type</h4>
            <div class="fixture-grid">
                ${FIXTURE_TYPES.map(type => `
                    <div class="fixture-option" onclick="selectFixtureType('${type}')">
                        <div class="fixture-icon">${getFixtureIcon(type)}</div>
                        <div class="fixture-name">${type.replace('_', ' ')}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    let palette = document.getElementById('fixturePalette');
    if (!palette) {
        const div = document.createElement('div');
        div.innerHTML = paletteHTML;
        document.querySelector('.canvas-container').appendChild(div.firstElementChild);
    } else {
        palette.classList.add('active');
    }
}

function hideFixturePalette() {
    const palette = document.getElementById('fixturePalette');
    if (palette) {
        palette.classList.remove('active');
    }
}

window.selectFixtureType = function(type) {
    const state = getState();
    state.selectedFixtureType = type;
    
    // Update visual selection
    document.querySelectorAll('.fixture-option').forEach(el => el.classList.remove('selected'));
    event.currentTarget.classList.add('selected');
};
