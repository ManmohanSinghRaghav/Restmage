// ===========================
// UTILS.JS - Utility Functions
// ===========================

// ===========================
// COORDINATE CONVERSION
// ===========================

function screenToFeet(screenX, screenY) {
    const state = getState();
    const x_ft = (screenX - state.offsetX) / (state.scale * state.zoom);
    const y_ft = (screenY - state.offsetY) / (state.scale * state.zoom);
    return { x_ft, y_ft };
}

function feetToScreen(x_ft, y_ft) {
    const state = getState();
    const screenX = x_ft * state.scale * state.zoom + state.offsetX;
    const screenY = y_ft * state.scale * state.zoom + state.offsetY;
    return { screenX, screenY };
}

// ===========================
// POLYGON CALCULATIONS
// ===========================

/**
 * Calculate area of a polygon using Shoelace formula
 * @param {Array} polygon - Array of {x_ft, y_ft} points
 * @returns {number} Area in square feet
 */
function calculatePolygonArea(polygon) {
    if (!polygon || polygon.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < polygon.length; i++) {
        const j = (i + 1) % polygon.length;
        area += polygon[i].x_ft * polygon[j].y_ft;
        area -= polygon[j].x_ft * polygon[i].y_ft;
    }
    return Math.abs(area / 2);
}

/**
 * Check if a point is inside a polygon
 * @param {Object} point - {x_ft, y_ft}
 * @param {Array} polygon - Array of {x_ft, y_ft} points
 * @returns {boolean}
 */
function pointInPolygon(point, polygon) {
    if (!polygon || polygon.length < 3) return false;
    
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x_ft, yi = polygon[i].y_ft;
        const xj = polygon[j].x_ft, yj = polygon[j].y_ft;
        
        const intersect = ((yi > point.y_ft) !== (yj > point.y_ft))
            && (point.x_ft < (xj - xi) * (point.y_ft - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

/**
 * Get bounding box of a polygon
 * @param {Array} polygon - Array of {x_ft, y_ft} points
 * @returns {Object} {minX, minY, maxX, maxY}
 */
function getPolygonBounds(polygon) {
    if (!polygon || polygon.length === 0) {
        return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }
    
    let minX = polygon[0].x_ft;
    let minY = polygon[0].y_ft;
    let maxX = polygon[0].x_ft;
    let maxY = polygon[0].y_ft;
    
    for (let i = 1; i < polygon.length; i++) {
        minX = Math.min(minX, polygon[i].x_ft);
        minY = Math.min(minY, polygon[i].y_ft);
        maxX = Math.max(maxX, polygon[i].x_ft);
        maxY = Math.max(maxY, polygon[i].y_ft);
    }
    
    return { minX, minY, maxX, maxY };
}

// ===========================
// DISTANCE CALCULATIONS
// ===========================

/**
 * Calculate distance between two points
 */
function distance(p1, p2) {
    const dx = p2.x_ft - p1.x_ft;
    const dy = p2.y_ft - p1.y_ft;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate distance from point to line segment
 */
function distanceToLine(point, lineStart, lineEnd) {
    const A = point.x_ft - lineStart.x_ft;
    const B = point.y_ft - lineStart.y_ft;
    const C = lineEnd.x_ft - lineStart.x_ft;
    const D = lineEnd.y_ft - lineStart.y_ft;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) param = dot / lenSq;
    
    let xx, yy;
    
    if (param < 0) {
        xx = lineStart.x_ft;
        yy = lineStart.y_ft;
    } else if (param > 1) {
        xx = lineEnd.x_ft;
        yy = lineEnd.y_ft;
    } else {
        xx = lineStart.x_ft + param * C;
        yy = lineStart.y_ft + param * D;
    }
    
    const dx = point.x_ft - xx;
    const dy = point.y_ft - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

// ===========================
// NEAREST POINT FUNCTIONS
// ===========================

/**
 * Find nearest point on a wall to a given point
 */
function nearestPointOnWall(point, wall) {
    const A = point.x_ft - wall.start.x_ft;
    const B = point.y_ft - wall.start.y_ft;
    const C = wall.end.x_ft - wall.start.x_ft;
    const D = wall.end.y_ft - wall.start.y_ft;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = lenSq !== 0 ? dot / lenSq : -1;
    
    // Clamp to [0, 1] to stay on the line segment
    param = Math.max(0, Math.min(1, param));
    
    return {
        x_ft: wall.start.x_ft + param * C,
        y_ft: wall.start.y_ft + param * D
    };
}

/**
 * Find the wall closest to a point (within tolerance)
 */
function findNearestWall(point, tolerance = 0.5) {
    const state = getState();
    let nearestWall = null;
    let minDist = tolerance;
    
    state.walls.forEach(wall => {
        const dist = distanceToLine(point, wall.start, wall.end);
        if (dist < minDist) {
            minDist = dist;
            nearestWall = wall;
        }
    });
    
    return nearestWall;
}

// ===========================
// ANGLE CALCULATIONS
// ===========================

/**
 * Calculate angle in degrees from point1 to point2
 */
function angleBetweenPoints(p1, p2) {
    const rad = Math.atan2(p2.y_ft - p1.y_ft, p2.x_ft - p1.x_ft);
    return rad * 180 / Math.PI;
}

/**
 * Snap angle to nearest 45 degrees
 */
function snapAngle(angle) {
    const snap = 45;
    return Math.round(angle / snap) * snap;
}

// ===========================
// FORMATTING HELPERS
// ===========================

function formatFeet(value) {
    return value.toFixed(1) + ' ft';
}

function formatArea(value) {
    return Math.round(value) + ' sqft';
}

function formatPercentage(value) {
    return value.toFixed(1) + '%';
}

// ===========================
// ID GENERATION
// ===========================

function generateId() {
    return Date.now() + Math.random().toString(36).substr(2, 9);
}

// ===========================
// ROOM TYPE COLORS
// ===========================

const ROOM_COLORS = {
    'bedroom': '#e8f5e9',
    'bathroom': '#e0f2f1',
    'kitchen': '#fff3e0',
    'living_room': '#e3f2fd',
    'dining': '#fce4ec',
    'hallway': '#f3e5f5',
    'pooja_room': '#fff9c4',
    'utility': '#f1f8e9',
    'storage': '#efebe9',
    'entry': '#ffebee'
};

function getRoomColor(type) {
    return ROOM_COLORS[type] || '#f5f5f5';
}

// ===========================
// FIXTURE ICONS
// ===========================

const FIXTURE_ICONS = {
    'toilet': '🚽',
    'sink': '🚰',
    'kitchen_sink': '🚰',
    'stove': '🔥',
    'shower': '🚿',
    'bathtub': '🛁',
    'washer': '🌀',
    'dryer': '📦'
};

function getFixtureIcon(type) {
    return FIXTURE_ICONS[type] || '📍';
}
