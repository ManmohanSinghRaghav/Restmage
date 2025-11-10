// ===========================
// IO.JS - Import/Export JSON
// ===========================

function initIO() {
    document.getElementById('exportBtn').addEventListener('click', exportToJSON);
    document.getElementById('importBtn').addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });
    document.getElementById('fileInput').addEventListener('change', handleFileImport);
}

// ===========================
// EXPORT TO JSON
// ===========================

function exportToJSON() {
    const state = getState();
    
    const data = {
        map_info: {
            title: state.mapInfo.title,
            author: state.mapInfo.author,
            date: state.mapInfo.date,
            scale: state.mapInfo.scale,
            north_direction: state.mapInfo.north_direction
        },
        plot_summary: {
            plot_length_ft: state.plotSummary.plot_length_ft,
            plot_width_ft: state.plotSummary.plot_width_ft,
            setback_front_ft: state.plotSummary.setback_front_ft,
            setback_rear_ft: state.plotSummary.setback_rear_ft,
            setback_side_left_ft: state.plotSummary.setback_side_left_ft,
            setback_side_right_ft: state.plotSummary.setback_side_right_ft
        },
        rooms: state.rooms.map(room => ({
            name: room.name,
            type: room.type,
            polygon: room.polygon.map(p => ({
                x_ft: parseFloat(p.x_ft.toFixed(2)),
                y_ft: parseFloat(p.y_ft.toFixed(2))
            }))
        })),
        walls: state.walls.map(wall => ({
            start: {
                x_ft: parseFloat(wall.start.x_ft.toFixed(2)),
                y_ft: parseFloat(wall.start.y_ft.toFixed(2))
            },
            end: {
                x_ft: parseFloat(wall.end.x_ft.toFixed(2)),
                y_ft: parseFloat(wall.end.y_ft.toFixed(2))
            },
            thickness_ft: parseFloat(wall.thickness_ft.toFixed(2))
        })),
        doors: state.doors.map(door => ({
            position: {
                x_ft: parseFloat(door.position.x_ft.toFixed(2)),
                y_ft: parseFloat(door.position.y_ft.toFixed(2))
            },
            width_ft: parseFloat(door.width_ft.toFixed(1)),
            swing: door.swing
        })),
        windows: state.windows.map(window => ({
            position: {
                x_ft: parseFloat(window.position.x_ft.toFixed(2)),
                y_ft: parseFloat(window.position.y_ft.toFixed(2))
            },
            width_ft: parseFloat(window.width_ft.toFixed(1))
        })),
        stairs: state.stairs.map(stair => ({
            footprint: stair.footprint.map(p => ({
                x_ft: parseFloat(p.x_ft.toFixed(2)),
                y_ft: parseFloat(p.y_ft.toFixed(2))
            })),
            direction: stair.direction,
            steps: stair.steps
        })),
        fixtures: state.fixtures.map(fixture => ({
            position: {
                x_ft: parseFloat(fixture.position.x_ft.toFixed(2)),
                y_ft: parseFloat(fixture.position.y_ft.toFixed(2))
            },
            type: fixture.type,
            rotation: fixture.rotation
        }))
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `floor-plan-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    
    console.log('Exported JSON:', data);
}

// ===========================
// IMPORT FROM JSON
// ===========================

function handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            importFromJSON(data);
            showToast('Floor plan loaded successfully!', 'success', 3000);
        } catch (error) {
            showToast('Error loading file: ' + error.message, 'error', 4000);
            console.error('Import error:', error);
        }
    };
    
    reader.readAsText(file);
    e.target.value = ''; // Reset input
}

function importFromJSON(data) {
    const state = getState();
    
    // Clear existing data
    state.rooms = [];
    state.walls = [];
    state.doors = [];
    state.windows = [];
    state.stairs = [];
    state.fixtures = [];
    clearSelection();
    
    // Import map info
    if (data.map_info) {
        state.mapInfo = { ...data.map_info };
        document.getElementById('mapTitle').value = state.mapInfo.title || '';
        document.getElementById('mapAuthor').value = state.mapInfo.author || '';
        document.getElementById('mapDate').value = state.mapInfo.date || '';
        document.getElementById('mapScale').value = state.mapInfo.scale || '';
    }
    
    // Import plot summary
    if (data.plot_summary) {
        state.plotSummary = { ...data.plot_summary };
        document.getElementById('plotLength').value = state.plotSummary.plot_length_ft;
        document.getElementById('plotWidth').value = state.plotSummary.plot_width_ft;
        document.getElementById('setbackFront').value = state.plotSummary.setback_front_ft;
        document.getElementById('setbackRear').value = state.plotSummary.setback_rear_ft;
        document.getElementById('setbackLeft').value = state.plotSummary.setback_side_left_ft;
        document.getElementById('setbackRight').value = state.plotSummary.setback_side_right_ft;
    }
    
    // Import rooms
    if (data.rooms) {
        data.rooms.forEach(roomData => {
            const room = {
                id: generateId(),
                name: roomData.name,
                type: roomData.type,
                polygon: roomData.polygon.map(p => ({
                    x_ft: p.x_ft,
                    y_ft: p.y_ft
                }))
            };
            state.rooms.push(room);
        });
    }
    
    // Import walls
    if (data.walls) {
        data.walls.forEach(wallData => {
            const wall = {
                id: generateId(),
                start: { x_ft: wallData.start.x_ft, y_ft: wallData.start.y_ft },
                end: { x_ft: wallData.end.x_ft, y_ft: wallData.end.y_ft },
                thickness_ft: wallData.thickness_ft
            };
            state.walls.push(wall);
        });
    }
    
    // Import doors
    if (data.doors) {
        data.doors.forEach(doorData => {
            const door = {
                id: generateId(),
                position: { x_ft: doorData.position.x_ft, y_ft: doorData.position.y_ft },
                width_ft: doorData.width_ft,
                swing: doorData.swing
            };
            state.doors.push(door);
        });
    }
    
    // Import windows
    if (data.windows) {
        data.windows.forEach(windowData => {
            const window = {
                id: generateId(),
                position: { x_ft: windowData.position.x_ft, y_ft: windowData.position.y_ft },
                width_ft: windowData.width_ft
            };
            state.windows.push(window);
        });
    }
    
    // Import stairs
    if (data.stairs) {
        data.stairs.forEach(stairData => {
            const stair = {
                id: generateId(),
                footprint: stairData.footprint.map(p => ({
                    x_ft: p.x_ft,
                    y_ft: p.y_ft
                })),
                direction: stairData.direction,
                steps: stairData.steps
            };
            state.stairs.push(stair);
        });
    }
    
    // Import fixtures
    if (data.fixtures) {
        data.fixtures.forEach(fixtureData => {
            const fixture = {
                id: generateId(),
                position: { x_ft: fixtureData.position.x_ft, y_ft: fixtureData.position.y_ft },
                type: fixtureData.type,
                rotation: fixtureData.rotation
            };
            state.fixtures.push(fixture);
        });
    }
    
    // Fit to view and render
    fitToView();
    render();
    updateUI();
    
    console.log('Imported data:', data);
}
