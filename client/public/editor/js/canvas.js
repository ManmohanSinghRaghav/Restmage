// ===========================
// CANVAS.JS - Canvas Rendering Engine
// ===========================

let canvas, ctx;

function initCanvas() {
    canvas = document.getElementById('floorCanvas');
    ctx = canvas.getContext('2d');
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    render();
}

function getCanvas() {
    return { canvas, ctx };
}

// ===========================
// MAIN RENDER FUNCTION
// ===========================

function render() {
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw in order (back to front)
    drawGrid();
    drawSetbackLines();
    drawPlotBoundary();
    drawWalls();
    drawRooms();
    drawDoors();
    drawWindows();
    drawFixtures();
    drawStairs();
    
    // Draw temporary elements while drawing
    drawTemporaryElements();
    
    // Draw selection box
    drawSelectionBox();
}

// ===========================
// GRID RENDERING
// ===========================

function drawGrid() {
    const state = getState();
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 1;
    
    const gridSize = state.scale * state.zoom;
    const startX = state.offsetX % gridSize;
    const startY = state.offsetY % gridSize;
    
    // Vertical lines
    for (let x = startX; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = startY; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Draw axis labels
    drawAxisLabels();
}

function drawAxisLabels() {
    const state = getState();
    ctx.fillStyle = '#999';
    ctx.font = '10px sans-serif';
    
    // X-axis labels (every 5 ft)
    for (let i = 0; i <= state.plotSummary.plot_length_ft; i += 5) {
        const { screenX } = feetToScreen(i, 0);
        if (screenX > state.offsetX - 20 && screenX < canvas.width) {
            ctx.fillText(`${i}'`, screenX + 2, state.offsetY - 5);
        }
    }
    
    // Y-axis labels (every 5 ft)
    for (let i = 0; i <= state.plotSummary.plot_width_ft; i += 5) {
        const { screenY } = feetToScreen(0, i);
        if (screenY > state.offsetY - 20 && screenY < canvas.height) {
            ctx.fillText(`${i}'`, state.offsetX - 25, screenY + 3);
        }
    }
}

// ===========================
// PLOT BOUNDARY
// ===========================

function drawPlotBoundary() {
    const state = getState();
    const { screenX: x1, screenY: y1 } = feetToScreen(0, 0);
    const { screenX: x2, screenY: y2 } = feetToScreen(
        state.plotSummary.plot_length_ft,
        state.plotSummary.plot_width_ft
    );
    
    // Outer plot boundary
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 3;
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    
    // Label
    ctx.fillStyle = '#2c3e50';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(
        `Plot: ${state.plotSummary.plot_length_ft} × ${state.plotSummary.plot_width_ft} ft`,
        x1 + 10,
        y1 + 25
    );
}

// ===========================
// SETBACK LINES
// ===========================

function drawSetbackLines() {
    const state = getState();
    const plot = state.plotSummary;
    
    const { screenX: x1, screenY: y1 } = feetToScreen(plot.setback_side_left_ft, plot.setback_front_ft);
    const { screenX: x2, screenY: y2 } = feetToScreen(
        plot.plot_length_ft - plot.setback_side_right_ft,
        plot.plot_width_ft - plot.setback_rear_ft
    );
    
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    ctx.setLineDash([]);
    
    // Setback labels
    ctx.fillStyle = '#e74c3c';
    ctx.font = '11px sans-serif';
    ctx.fillText('Buildable Area', x1 + 10, y1 + 15);
}

// ===========================
// DRAWING HELPER FUNCTIONS
// ===========================

function drawPolygon(polygon, fillColor, strokeColor, lineWidth = 2) {
    if (!polygon || polygon.length < 2) return;
    
    ctx.beginPath();
    const first = feetToScreen(polygon[0].x_ft, polygon[0].y_ft);
    ctx.moveTo(first.screenX, first.screenY);
    
    for (let i = 1; i < polygon.length; i++) {
        const point = feetToScreen(polygon[i].x_ft, polygon[i].y_ft);
        ctx.lineTo(point.screenX, point.screenY);
    }
    ctx.closePath();
    
    if (fillColor) {
        ctx.fillStyle = fillColor;
        ctx.fill();
    }
    
    if (strokeColor) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.stroke();
    }
}

function drawLine(start, end, color, thickness) {
    const p1 = feetToScreen(start.x_ft, start.y_ft);
    const p2 = feetToScreen(end.x_ft, end.y_ft);
    
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(p1.screenX, p1.screenY);
    ctx.lineTo(p2.screenX, p2.screenY);
    ctx.stroke();
}

function drawPoint(point, color, size = 6) {
    const p = feetToScreen(point.x_ft, point.y_ft);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.screenX, p.screenY, size, 0, Math.PI * 2);
    ctx.fill();
}

function drawText(text, point, color = '#2c3e50', font = '12px sans-serif', align = 'center') {
    const p = feetToScreen(point.x_ft, point.y_ft);
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, p.screenX, p.screenY);
}

// ===========================
// MODULE-SPECIFIC RENDERING
// (Called by respective modules)
// ===========================

function drawRooms() {
    const state = getState();
    state.rooms.forEach(room => {
        drawRoom(room, room === state.selectedElement);
    });
}

function drawWalls() {
    const state = getState();
    state.walls.forEach(wall => {
        drawWall(wall, wall === state.selectedElement);
    });
}

function drawDoors() {
    const state = getState();
    state.doors.forEach(door => {
        drawDoor(door, door === state.selectedElement);
    });
}

function drawWindows() {
    const state = getState();
    state.windows.forEach(window => {
        drawWindow(window, window === state.selectedElement);
    });
}

function drawFixtures() {
    const state = getState();
    state.fixtures.forEach(fixture => {
        drawFixture(fixture, fixture === state.selectedElement);
    });
}

function drawStairs() {
    const state = getState();
    state.stairs.forEach(stair => {
        drawStair(stair, stair === state.selectedElement);
    });
}

function drawTemporaryElements() {
    const state = getState();
    
    // Draw temporary room polygon while drawing
    if (state.activeTool === 'room' && state.drawingPoints.length > 0) {
        drawTempRoom();
    }
    
    // Draw temporary wall while drawing
    if (state.activeTool === 'wall' && state.tempStart) {
        drawTempWall();
    }
}

// These functions will be implemented in their respective module files
function drawRoom(room, isSelected) {
    // Implemented in rooms.js
}

function drawWall(wall, isSelected) {
    // Implemented in walls.js
}

function drawDoor(door, isSelected) {
    // Implemented in doors.js
}

function drawWindow(window, isSelected) {
    // Implemented in windows.js
}

function drawFixture(fixture, isSelected) {
    // Implemented in fixtures.js
}

function drawStair(stair, isSelected) {
    // Implemented in stairs.js (if needed)
}

function drawTempRoom() {
    // Implemented in rooms.js
}

function drawTempWall() {
    // Implemented in walls.js
}

// ===========================
// SELECTION BOX
// ===========================

function drawSelectionBox() {
    const state = getState();
    
    if (!state.selectionBox) return;
    
    const box = state.selectionBox;
    const start = feetToScreen(box.startX, box.startY);
    const end = feetToScreen(box.endX, box.endY);
    
    const x = Math.min(start.screenX, end.screenX);
    const y = Math.min(start.screenY, end.screenY);
    const width = Math.abs(end.screenX - start.screenX);
    const height = Math.abs(end.screenY - start.screenY);
    
    // Draw filled rectangle
    ctx.fillStyle = 'rgba(52, 152, 219, 0.1)';
    ctx.fillRect(x, y, width, height);
    
    // Draw border
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(x, y, width, height);
    ctx.setLineDash([]);
}
