import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './MapEditor.module.css';
import { useNotification } from '../../contexts/NotificationContext';
import FloorPlanGeneratorDialog from './FloorPlanGeneratorDialog';

// TypeScript interfaces
interface Point {
  x_ft: number;
  y_ft: number;
}

interface Room {
  id: string;
  name: string;
  type: string;
  polygon: Point[];
  color?: string;
}

interface Wall {
  id: string;
  start: Point;
  end: Point;
  thickness: number;
}

interface Door {
  id: string;
  position: Point;
  wall: string;
  width: number;
  swing: string;
}

interface Window {
  id: string;
  position: Point;
  wall: string;
  width: number;
}

interface Fixture {
  id: string;
  type: string;
  position: Point;
  rotation: number;
}

interface MapInfo {
  title: string;
  author: string;
  date: string;
  scale: string;
  north_direction: string;
}

interface PlotSummary {
  plot_length_ft: number;
  plot_width_ft: number;
  setback_front_ft: number;
  setback_rear_ft: number;
  setback_side_left_ft: number;
  setback_side_right_ft: number;
}

interface EditorState {
  mapInfo: MapInfo;
  plotSummary: PlotSummary;
  rooms: Room[];
  walls: Wall[];
  doors: Door[];
  windows: Window[];
  fixtures: Fixture[];
  scale: number;
  offsetX: number;
  offsetY: number;
  zoom: number;
}

const ROOM_COLORS: Record<string, string> = {
  bedroom: '#e8f5e9',
  bathroom: '#e0f2f1',
  kitchen: '#fff3e0',
  living_room: '#e3f2fd',
  dining: '#fce4ec',
  hallway: '#f3e5f5',
  guest_room: '#fff9c4',
  pooja_room: '#ffe0b2',
  other: '#f5f5f5',
};

const FIXTURE_TYPES = [
  'toilet', 'sink', 'bathtub', 'shower', 'bed', 'sofa', 'table', 'chair', 'stove', 'refrigerator'
];

const ROOM_TYPES = [
  'bedroom', 'bathroom', 'kitchen', 'living_room', 'dining', 'hallway', 'guest_room', 'pooja_room', 'other'
];

const MapEditor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showNotification } = useNotification();

  // Main state
  const [state, setState] = useState<EditorState>({
    mapInfo: {
      title: 'Floor Plan',
      author: 'Architect',
      date: new Date().toISOString().split('T')[0],
      scale: '1:100',
      north_direction: 'Top of map',
    },
    plotSummary: {
      plot_length_ft: 50,
      plot_width_ft: 30,
      setback_front_ft: 5,
      setback_rear_ft: 3,
      setback_side_left_ft: 3,
      setback_side_right_ft: 3,
    },
    rooms: [],
    walls: [],
    doors: [],
    windows: [],
    fixtures: [],
    scale: 10,
    offsetX: 60,
    offsetY: 60,
    zoom: 1,
  });

  // UI state
  const [activeTool, setActiveTool] = useState<'select' | 'room' | 'wall' | 'door' | 'window' | 'fixture'>('select');
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<Point[]>([]);
  const [tempStart, setTempStart] = useState<Point | null>(null);
  const [selectedFixtureType, setSelectedFixtureType] = useState('toilet');
  const [activeTab, setActiveTab] = useState<'rooms' | 'walls' | 'openings' | 'fixtures'>('rooms');
  const [canvasCoords, setCanvasCoords] = useState('0, 0 ft');
  const [showGeneratorDialog, setShowGeneratorDialog] = useState(false);

  // History for undo/redo
  const [history, setHistory] = useState<EditorState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Coordinate conversion
  const screenToFeet = useCallback((screenX: number, screenY: number): Point => {
    return {
      x_ft: (screenX - state.offsetX) / state.scale / state.zoom,
      y_ft: (screenY - state.offsetY) / state.scale / state.zoom,
    };
  }, [state.scale, state.offsetX, state.offsetY, state.zoom]);

  const feetToScreen = useCallback((x_ft: number, y_ft: number) => {
    return {
      x: state.offsetX + x_ft * state.scale * state.zoom,
      y: state.offsetY + y_ft * state.scale * state.zoom,
    };
  }, [state.scale, state.offsetX, state.offsetY, state.zoom]);

  // Save to history
  const saveToHistory = useCallback(() => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(state)));
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [state, history, historyIndex]);

  // Undo/Redo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setState(JSON.parse(JSON.stringify(history[historyIndex - 1])));
      showNotification('Undone', 'info');
    }
  }, [historyIndex, history, showNotification]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setState(JSON.parse(JSON.stringify(history[historyIndex + 1])));
      showNotification('Redone', 'info');
    }
  }, [historyIndex, history, showNotification]);

  // Calculate polygon area using shoelace formula
  const calculatePolygonArea = (polygon: Point[]): number => {
    if (polygon.length < 3) return 0;
    let area = 0;
    for (let i = 0; i < polygon.length; i++) {
      const j = (i + 1) % polygon.length;
      area += polygon[i].x_ft * polygon[j].y_ft;
      area -= polygon[j].x_ft * polygon[i].y_ft;
    }
    return Math.abs(area / 2);
  };

  // Drawing functions
  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 0.5;

    const gridSize = 5 * state.scale * state.zoom;
    for (let x = state.offsetX % gridSize; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = state.offsetY % gridSize; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  };

  const drawPlotBoundary = (ctx: CanvasRenderingContext2D) => {
    const { plot_length_ft, plot_width_ft, setback_front_ft, setback_rear_ft, setback_side_left_ft, setback_side_right_ft } = state.plotSummary;

    // Outer boundary
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    const tl = feetToScreen(0, 0);
    const br = feetToScreen(plot_width_ft, plot_length_ft);
    ctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
    ctx.setLineDash([]);

    // Building boundary (with setbacks)
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 2;
    const btl = feetToScreen(setback_side_left_ft, setback_front_ft);
    const bbr = feetToScreen(plot_width_ft - setback_side_right_ft, plot_length_ft - setback_rear_ft);
    ctx.strokeRect(btl.x, btl.y, bbr.x - btl.x, bbr.y - btl.y);
  };

  const drawRoom = (ctx: CanvasRenderingContext2D, room: Room, selected: boolean) => {
    if (!room.polygon || room.polygon.length < 3) return;

    const color = ROOM_COLORS[room.type] || ROOM_COLORS.other;
    ctx.fillStyle = color;
    ctx.strokeStyle = selected ? '#e74c3c' : '#333';
    ctx.lineWidth = selected ? 3 : 2;

    ctx.beginPath();
    const first = feetToScreen(room.polygon[0].x_ft, room.polygon[0].y_ft);
    ctx.moveTo(first.x, first.y);
    for (let i = 1; i < room.polygon.length; i++) {
      const point = feetToScreen(room.polygon[i].x_ft, room.polygon[i].y_ft);
      ctx.lineTo(point.x, point.y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw room name
    const centerX = room.polygon.reduce((sum, p) => sum + p.x_ft, 0) / room.polygon.length;
    const centerY = room.polygon.reduce((sum, p) => sum + p.y_ft, 0) / room.polygon.length;
    const center = feetToScreen(centerX, centerY);
    
    ctx.fillStyle = '#333';
    ctx.font = `${12 * state.zoom}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText(room.name, center.x, center.y);
  };

  const drawWall = (ctx: CanvasRenderingContext2D, wall: Wall, selected: boolean) => {
    if (!wall || !wall.start || !wall.end) return;

    const start = feetToScreen(wall.start.x_ft, wall.start.y_ft);
    const end = feetToScreen(wall.end.x_ft, wall.end.y_ft);

    ctx.strokeStyle = selected ? '#e74c3c' : '#333';
    ctx.lineWidth = Math.max(3, wall.thickness * state.scale * state.zoom);
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  };

  const drawDoor = (ctx: CanvasRenderingContext2D, door: Door, selected: boolean) => {
    if (!door || !door.position) return;

    const pos = feetToScreen(door.position.x_ft, door.position.y_ft);
    const width = door.width * state.scale * state.zoom;

    ctx.fillStyle = selected ? '#e74c3c' : '#9b59b6';
    ctx.fillRect(pos.x - width / 2, pos.y - 5, width, 10);
    
    ctx.strokeStyle = '#6c3483';
    ctx.lineWidth = 2;
    ctx.strokeRect(pos.x - width / 2, pos.y - 5, width, 10);
  };

  const drawWindow = (ctx: CanvasRenderingContext2D, window: Window, selected: boolean) => {
    if (!window || !window.position) return;

    const pos = feetToScreen(window.position.x_ft, window.position.y_ft);
    const width = window.width * state.scale * state.zoom;

    ctx.fillStyle = selected ? '#e74c3c' : '#2196F3';
    ctx.fillRect(pos.x - width / 2, pos.y - 5, width, 10);
    
    ctx.strokeStyle = '#1565C0';
    ctx.lineWidth = 2;
    ctx.strokeRect(pos.x - width / 2, pos.y - 5, width, 10);
  };

  const drawFixture = (ctx: CanvasRenderingContext2D, fixture: Fixture, selected: boolean) => {
    if (!fixture || !fixture.position) return;

    const pos = feetToScreen(fixture.position.x_ft, fixture.position.y_ft);
    const size = 20 * state.zoom;

    ctx.fillStyle = selected ? '#e74c3c' : '#27ae60';
    ctx.strokeStyle = '#229954';
    ctx.lineWidth = 2;

    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate((fixture.rotation * Math.PI) / 180);
    ctx.fillRect(-size / 2, -size / 2, size, size);
    ctx.strokeRect(-size / 2, -size / 2, size, size);
    
    ctx.fillStyle = 'white';
    ctx.font = `${10 * state.zoom}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fixture.type.substring(0, 2).toUpperCase(), 0, 0);
    ctx.restore();
  };

  // Main render function
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawGrid(ctx);
    drawPlotBoundary(ctx);

    if (state.rooms && Array.isArray(state.rooms)) {
      state.rooms.forEach(room => drawRoom(ctx, room, room === selectedElement));
    }

    if (state.walls && Array.isArray(state.walls)) {
      state.walls.forEach(wall => drawWall(ctx, wall, wall === selectedElement));
    }

    if (state.doors && Array.isArray(state.doors)) {
      state.doors.forEach(door => drawDoor(ctx, door, door === selectedElement));
    }

    if (state.windows && Array.isArray(state.windows)) {
      state.windows.forEach(window => drawWindow(ctx, window, window === selectedElement));
    }

    if (state.fixtures && Array.isArray(state.fixtures)) {
      state.fixtures.forEach(fixture => drawFixture(ctx, fixture, fixture === selectedElement));
    }

    // Draw temporary elements
    if (isDrawing && activeTool === 'room' && drawingPoints.length > 0) {
      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      const first = feetToScreen(drawingPoints[0].x_ft, drawingPoints[0].y_ft);
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < drawingPoints.length; i++) {
        const point = feetToScreen(drawingPoints[i].x_ft, drawingPoints[i].y_ft);
        ctx.lineTo(point.x, point.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (isDrawing && activeTool === 'wall' && tempStart) {
      ctx.strokeStyle = '#3498db';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      const start = feetToScreen(tempStart.x_ft, tempStart.y_ft);
      ctx.moveTo(start.x, start.y);
      // Draw to current mouse position would be here
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [state, selectedElement, activeTool, isDrawing, drawingPoints, tempStart, feetToScreen]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Canvas interaction handlers
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const point = screenToFeet(x, y);

    if (activeTool === 'room') {
      if (!isDrawing) {
        setIsDrawing(true);
        setDrawingPoints([point]);
      } else {
        // Double click to finish
        if (e.detail === 2 && drawingPoints.length >= 3) {
          const newRoom: Room = {
            id: `room-${Date.now()}`,
            name: `Room ${state.rooms.length + 1}`,
            type: 'other',
            polygon: drawingPoints,
          };
          setState(prev => ({ ...prev, rooms: [...prev.rooms, newRoom] }));
          setDrawingPoints([]);
          setIsDrawing(false);
          saveToHistory();
          showNotification('Room created', 'success');
        } else {
          setDrawingPoints([...drawingPoints, point]);
        }
      }
    } else if (activeTool === 'wall') {
      if (!tempStart) {
        setTempStart(point);
        setIsDrawing(true);
      } else {
        const newWall: Wall = {
          id: `wall-${Date.now()}`,
          start: tempStart,
          end: point,
          thickness: 0.5,
        };
        setState(prev => ({ ...prev, walls: [...prev.walls, newWall] }));
        setTempStart(null);
        setIsDrawing(false);
        saveToHistory();
        showNotification('Wall created', 'success');
      }
    } else if (activeTool === 'door') {
      const newDoor: Door = {
        id: `door-${Date.now()}`,
        position: point,
        wall: '',
        width: 3,
        swing: 'in',
      };
      setState(prev => ({ ...prev, doors: [...prev.doors, newDoor] }));
      saveToHistory();
      showNotification('Door added', 'success');
    } else if (activeTool === 'window') {
      const newWindow: Window = {
        id: `window-${Date.now()}`,
        position: point,
        wall: '',
        width: 3,
      };
      setState(prev => ({ ...prev, windows: [...prev.windows, newWindow] }));
      saveToHistory();
      showNotification('Window added', 'success');
    } else if (activeTool === 'fixture') {
      const newFixture: Fixture = {
        id: `fixture-${Date.now()}`,
        type: selectedFixtureType,
        position: point,
        rotation: 0,
      };
      setState(prev => ({ ...prev, fixtures: [...prev.fixtures, newFixture] }));
      saveToHistory();
      showNotification(`${selectedFixtureType} added`, 'success');
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const point = screenToFeet(x, y);
    
    setCanvasCoords(`${point.x_ft.toFixed(1)}, ${point.y_ft.toFixed(1)} ft`);
  };

  const handleCanvasRightClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (isDrawing) {
      setIsDrawing(false);
      setDrawingPoints([]);
      setTempStart(null);
      showNotification('Drawing cancelled', 'info');
    }
  };

  // Import/Export
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        
        if (imported.map_info || imported.plot_summary) {
          // Convert Gemini AI format
          const converted: Partial<EditorState> = {
            mapInfo: imported.map_info || state.mapInfo,
            plotSummary: imported.plot_summary || state.plotSummary,
            rooms: (imported.rooms || []).map((room: any, idx: number) => ({
              id: `room-${idx + 1}`,
              name: room.name || `Room ${idx + 1}`,
              type: room.type || 'other',
              polygon: room.polygon || [],
              color: ROOM_COLORS[room.type] || ROOM_COLORS.other,
            })),
            walls: imported.walls || [],
            doors: imported.doors || [],
            windows: (imported.windows || []).map((window: any, idx: number) => ({
              id: `window-${idx + 1}`,
              position: window.position || { x_ft: 0, y_ft: 0 },
              wall: '',
              width: window.width_ft || 3,
            })),
            fixtures: [],
          };
          
          setState(prev => ({ ...prev, ...converted }));
          showNotification(`Floor plan imported: ${imported.map_info?.title || 'Untitled'}`, 'success');
        } else {
          setState(imported);
          showNotification('Floor plan imported successfully', 'success');
        }
        
        saveToHistory();
      } catch (error) {
        console.error('Import error:', error);
        showNotification('Failed to import floor plan', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${state.mapInfo.title.replace(/\s+/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('Floor plan exported', 'success');
  };

  // Zoom functions
  const handleZoomIn = () => {
    setState(prev => ({ ...prev, zoom: Math.min(prev.zoom + 0.2, 3) }));
  };

  const handleZoomOut = () => {
    setState(prev => ({ ...prev, zoom: Math.max(prev.zoom - 0.2, 0.5) }));
  };

  const handleFitView = () => {
    setState(prev => ({ ...prev, zoom: 1, offsetX: 60, offsetY: 60 }));
  };

  // Handle AI-generated floor plan
  const handleFloorPlanGenerated = useCallback((floorPlanData: any) => {
    // Convert the Gemini AI format to our internal format
    const convertedRooms = (floorPlanData.rooms || []).map((room: any, idx: number) => ({
      id: `room-${idx + 1}`,
      name: room.name || `Room ${idx + 1}`,
      type: room.type || 'other',
      polygon: room.polygon || [],
      color: ROOM_COLORS[room.type] || ROOM_COLORS.other,
    }));

    const convertedWalls = (floorPlanData.walls || []).map((wall: any, idx: number) => ({
      id: `wall-${idx + 1}`,
      start: wall.start || { x_ft: 0, y_ft: 0 },
      end: wall.end || { x_ft: 0, y_ft: 0 },
      thickness: wall.thickness_ft || 0.5,
    }));

    const convertedDoors = (floorPlanData.doors || []).map((door: any, idx: number) => ({
      id: `door-${idx + 1}`,
      position: door.position || { x_ft: 0, y_ft: 0 },
      wall: '',
      width: door.width_ft || 3,
      swing: door.swing || 'in',
    }));

    const convertedWindows = (floorPlanData.windows || []).map((window: any, idx: number) => ({
      id: `window-${idx + 1}`,
      position: window.position || { x_ft: 0, y_ft: 0 },
      wall: '',
      width: window.width_ft || 3,
    }));

    const convertedFixtures = (floorPlanData.fixtures || []).map((fixture: any, idx: number) => ({
      id: `fixture-${idx + 1}`,
      type: fixture.type || 'toilet',
      position: fixture.position || { x_ft: 0, y_ft: 0 },
      rotation: fixture.rotation || 0,
    }));

    // Update state with generated data
    setState(prev => ({
      ...prev,
      mapInfo: floorPlanData.map_info || prev.mapInfo,
      plotSummary: floorPlanData.plot_summary || prev.plotSummary,
      rooms: convertedRooms,
      walls: convertedWalls,
      doors: convertedDoors,
      windows: convertedWindows,
      fixtures: convertedFixtures,
    }));

    saveToHistory();
    showNotification('AI floor plan loaded successfully!', 'success');
  }, [saveToHistory, showNotification]);

  // Delete selected element
  const deleteSelectedElement = () => {
    if (!selectedElement || !selectedType) return;

    const arrayKey = (selectedType + 's') as 'rooms' | 'walls' | 'doors' | 'windows' | 'fixtures';
    setState(prev => ({
      ...prev,
      [arrayKey]: (prev[arrayKey] as any[]).filter((item: any) => item.id !== selectedElement.id),
    }));
    
    setSelectedElement(null);
    setSelectedType(null);
    saveToHistory();
    showNotification('Element deleted', 'success');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement) {
        e.preventDefault();
        deleteSelectedElement();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        handleZoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        handleZoomOut();
      } else if (e.key.toLowerCase() === 'v') {
        setActiveTool('select');
      } else if (e.key.toLowerCase() === 'r') {
        setActiveTool('room');
      } else if (e.key.toLowerCase() === 'w') {
        setActiveTool('wall');
      } else if (e.key.toLowerCase() === 'd') {
        setActiveTool('door');
      } else if (e.key.toLowerCase() === 'n') {
        setActiveTool('window');
      } else if (e.key.toLowerCase() === 'f') {
        setActiveTool('fixture');
      } else if (e.key === 'Escape') {
        setIsDrawing(false);
        setDrawingPoints([]);
        setTempStart(null);
        setSelectedElement(null);
        setSelectedType(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedElement, historyIndex, history.length]);

  // Canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      renderCanvas();
    }
  }, [renderCanvas]);

  // Calculate summary stats
  const totalBuiltUpArea = (state.rooms && Array.isArray(state.rooms))
    ? state.rooms.reduce((sum, room) => sum + calculatePolygonArea(room.polygon), 0)
    : 0;
  const plotArea = state.plotSummary.plot_length_ft * state.plotSummary.plot_width_ft;
  const coverage = plotArea > 0 ? ((totalBuiltUpArea / plotArea) * 100).toFixed(1) : '0';

  return (
    <div className={styles.container}>
      {/* Toolbar */}
      <header className={styles.toolbar}>
        <div className={styles.toolbarSection}>
          <h1>
            <svg className={styles.logoIcon} width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 22V12h6v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Floor Plan Editor
          </h1>
          <span className={styles.version}>v2.0</span>
        </div>
        <div className={styles.toolbarSection}>
          <button 
            className={styles.btnIcon} 
            title="Undo (Ctrl+Z)" 
            disabled={historyIndex <= 0}
            onClick={undo}
          >
            ↶
          </button>
          <button 
            className={styles.btnIcon} 
            title="Redo (Ctrl+Y)" 
            disabled={historyIndex >= history.length - 1}
            onClick={redo}
          >
            ↷
          </button>
          <div className={styles.toolbarDivider}></div>
          <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={() => fileInputRef.current?.click()}>
            Import
          </button>
          <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleExport}>
            Export
          </button>
          <div className={styles.toolbarDivider}></div>
          <button 
            className={`${styles.btn} ${styles.btnPrimary}`} 
            onClick={() => setShowGeneratorDialog(true)}
            style={{ backgroundColor: '#4CAF50' }}
          >
            🤖 Generate with AI
          </button>
          <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
        </div>
      </header>

      {/* Tools Bar */}
      <div className={styles.toolsBar}>
        <div className={styles.toolGroup}>
          <button 
            className={`${styles.toolBtn} ${activeTool === 'select' ? styles.active : ''}`}
            onClick={() => setActiveTool('select')}
            title="Select (V)"
          >
            Select
          </button>
          <button 
            className={`${styles.toolBtn} ${activeTool === 'room' ? styles.active : ''}`}
            onClick={() => setActiveTool('room')}
            title="Draw Room (R)"
          >
            Room
          </button>
          <button 
            className={`${styles.toolBtn} ${activeTool === 'wall' ? styles.active : ''}`}
            onClick={() => setActiveTool('wall')}
            title="Draw Wall (W)"
          >
            Wall
          </button>
          <button 
            className={`${styles.toolBtn} ${activeTool === 'door' ? styles.active : ''}`}
            onClick={() => setActiveTool('door')}
            title="Add Door (D)"
          >
            Door
          </button>
          <button 
            className={`${styles.toolBtn} ${activeTool === 'window' ? styles.active : ''}`}
            onClick={() => setActiveTool('window')}
            title="Add Window (N)"
          >
            Window
          </button>
          <button 
            className={`${styles.toolBtn} ${activeTool === 'fixture' ? styles.active : ''}`}
            onClick={() => setActiveTool('fixture')}
            title="Add Fixture (F)"
          >
            Fixture
          </button>
        </div>
        <div className={styles.toolGroup}>
          <button className={styles.btnIcon} title="Zoom In (+)" onClick={handleZoomIn}>+</button>
          <button className={styles.btnIcon} title="Zoom Out (-)" onClick={handleZoomOut}>−</button>
          <button className={styles.btnIcon} title="Fit View (F)" onClick={handleFitView}>⤢</button>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        <div className={styles.canvasContainer}>
          <canvas 
            ref={canvasRef} 
            className={styles.canvas}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            onContextMenu={handleCanvasRightClick}
          />
          <div className={styles.canvasInfo}>{canvasCoords}</div>
        </div>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          {/* Map Info Panel */}
          <div className={styles.panel}>
            <h3>Map Information</h3>
            <div className={styles.formGroup}>
              <label>Title:</label>
              <input 
                type="text" 
                value={state.mapInfo.title}
                onChange={(e) => setState(prev => ({ ...prev, mapInfo: { ...prev.mapInfo, title: e.target.value } }))}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Author:</label>
              <input 
                type="text" 
                value={state.mapInfo.author}
                onChange={(e) => setState(prev => ({ ...prev, mapInfo: { ...prev.mapInfo, author: e.target.value } }))}
              />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Date:</label>
                <input 
                  type="date" 
                  value={state.mapInfo.date}
                  onChange={(e) => setState(prev => ({ ...prev, mapInfo: { ...prev.mapInfo, date: e.target.value } }))}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Scale:</label>
                <input 
                  type="text" 
                  value={state.mapInfo.scale}
                  onChange={(e) => setState(prev => ({ ...prev, mapInfo: { ...prev.mapInfo, scale: e.target.value } }))}
                />
              </div>
            </div>
          </div>

          {/* Plot Settings Panel */}
          <div className={styles.panel}>
            <h3>Plot Settings</h3>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Length (ft):</label>
                <input 
                  type="number" 
                  value={state.plotSummary.plot_length_ft}
                  onChange={(e) => setState(prev => ({ ...prev, plotSummary: { ...prev.plotSummary, plot_length_ft: parseFloat(e.target.value) } }))}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Width (ft):</label>
                <input 
                  type="number" 
                  value={state.plotSummary.plot_width_ft}
                  onChange={(e) => setState(prev => ({ ...prev, plotSummary: { ...prev.plotSummary, plot_width_ft: parseFloat(e.target.value) } }))}
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Setbacks (ft):</label>
              <div className={styles.setbackGrid}>
                <input 
                  type="number" 
                  placeholder="Front"
                  value={state.plotSummary.setback_front_ft}
                  onChange={(e) => setState(prev => ({ ...prev, plotSummary: { ...prev.plotSummary, setback_front_ft: parseFloat(e.target.value) } }))}
                  className={styles.inputCompact}
                />
                <input 
                  type="number" 
                  placeholder="Rear"
                  value={state.plotSummary.setback_rear_ft}
                  onChange={(e) => setState(prev => ({ ...prev, plotSummary: { ...prev.plotSummary, setback_rear_ft: parseFloat(e.target.value) } }))}
                  className={styles.inputCompact}
                />
                <input 
                  type="number" 
                  placeholder="Left"
                  value={state.plotSummary.setback_side_left_ft}
                  onChange={(e) => setState(prev => ({ ...prev, plotSummary: { ...prev.plotSummary, setback_side_left_ft: parseFloat(e.target.value) } }))}
                  className={styles.inputCompact}
                />
                <input 
                  type="number" 
                  placeholder="Right"
                  value={state.plotSummary.setback_side_right_ft}
                  onChange={(e) => setState(prev => ({ ...prev, plotSummary: { ...prev.plotSummary, setback_side_right_ft: parseFloat(e.target.value) } }))}
                  className={styles.inputCompact}
                />
              </div>
            </div>
          </div>

          {/* Summary Panel */}
          <div className={styles.panel}>
            <h3>Summary</h3>
            <div className={styles.summaryGrid}>
              <div className={styles.summaryItem}>
                <label>Plot Area:</label>
                <span>{plotArea.toFixed(0)} sqft</span>
              </div>
              <div className={styles.summaryItem}>
                <label>Built-up Area:</label>
                <span>{totalBuiltUpArea.toFixed(0)} sqft</span>
              </div>
              <div className={styles.summaryItem}>
                <label>Coverage:</label>
                <span>{coverage}%</span>
              </div>
              <div className={styles.summaryItem}>
                <label>Rooms:</label>
                <span>{state.rooms.length}</span>
              </div>
              <div className={styles.summaryItem}>
                <label>Walls:</label>
                <span>{state.walls.length}</span>
              </div>
              <div className={styles.summaryItem}>
                <label>Doors:</label>
                <span>{state.doors.length}</span>
              </div>
              <div className={styles.summaryItem}>
                <label>Windows:</label>
                <span>{state.windows.length}</span>
              </div>
              <div className={styles.summaryItem}>
                <label>Fixtures:</label>
                <span>{state.fixtures.length}</span>
              </div>
            </div>
          </div>

          {/* Properties Panel */}
          {selectedElement && (
            <div className={styles.panel}>
              <h3>Properties</h3>
              {selectedType === 'room' && (
                <>
                  <div className={styles.formGroup}>
                    <label>Name:</label>
                    <input 
                      type="text" 
                      value={selectedElement.name}
                      onChange={(e) => {
                        selectedElement.name = e.target.value;
                        setState({...state});
                      }}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Type:</label>
                    <select 
                      value={selectedElement.type}
                      onChange={(e) => {
                        selectedElement.type = e.target.value;
                        setState({...state});
                      }}
                    >
                      {ROOM_TYPES.map(type => (
                        <option key={type} value={type}>{type.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.summaryItem}>
                    <label>Area:</label>
                    <span>{calculatePolygonArea(selectedElement.polygon).toFixed(1)} sqft</span>
                  </div>
                  <button className={styles.deleteBtn} onClick={deleteSelectedElement}>Delete Room</button>
                </>
              )}
              {selectedType === 'fixture' && activeTool === 'fixture' && (
                <div className={styles.formGroup}>
                  <label>Fixture Type:</label>
                  <select 
                    value={selectedFixtureType}
                    onChange={(e) => setSelectedFixtureType(e.target.value)}
                  >
                    {FIXTURE_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Elements Panel */}
          <div className={styles.panel}>
            <h3>Elements</h3>
            <div className={styles.tabs}>
              <button 
                className={`${styles.tabBtn} ${activeTab === 'rooms' ? styles.active : ''}`}
                onClick={() => setActiveTab('rooms')}
              >
                Rooms
              </button>
              <button 
                className={`${styles.tabBtn} ${activeTab === 'walls' ? styles.active : ''}`}
                onClick={() => setActiveTab('walls')}
              >
                Walls
              </button>
              <button 
                className={`${styles.tabBtn} ${activeTab === 'openings' ? styles.active : ''}`}
                onClick={() => setActiveTab('openings')}
              >
                Openings
              </button>
              <button 
                className={`${styles.tabBtn} ${activeTab === 'fixtures' ? styles.active : ''}`}
                onClick={() => setActiveTab('fixtures')}
              >
                Fixtures
              </button>
            </div>
            <div className={styles.elementsList}>
              {activeTab === 'rooms' && state.rooms.length === 0 && (
                <p className={styles.placeholder}>No rooms yet</p>
              )}
              {activeTab === 'rooms' && state.rooms.map(room => (
                <div 
                  key={room.id} 
                  className={`${styles.elementItem} ${selectedElement === room ? styles.selected : ''}`}
                  onClick={() => { setSelectedElement(room); setSelectedType('room'); }}
                >
                  <span>{room.name}</span>
                  <span className={styles.badge}>{room.type}</span>
                </div>
              ))}
              
              {activeTab === 'walls' && state.walls.length === 0 && (
                <p className={styles.placeholder}>No walls yet</p>
              )}
              {activeTab === 'walls' && state.walls.map(wall => (
                <div 
                  key={wall.id} 
                  className={`${styles.elementItem} ${selectedElement === wall ? styles.selected : ''}`}
                  onClick={() => { setSelectedElement(wall); setSelectedType('wall'); }}
                >
                  <span>Wall</span>
                </div>
              ))}

              {activeTab === 'openings' && state.doors.length === 0 && state.windows.length === 0 && (
                <p className={styles.placeholder}>No openings yet</p>
              )}
              {activeTab === 'openings' && [...state.doors, ...state.windows].map(item => (
                <div 
                  key={item.id} 
                  className={`${styles.elementItem} ${selectedElement === item ? styles.selected : ''}`}
                  onClick={() => { setSelectedElement(item); setSelectedType('door' in item ? 'door' : 'window'); }}
                >
                  <span>{'swing' in item ? 'Door' : 'Window'}</span>
                </div>
              ))}

              {activeTab === 'fixtures' && state.fixtures.length === 0 && (
                <p className={styles.placeholder}>No fixtures yet</p>
              )}
              {activeTab === 'fixtures' && state.fixtures.map(fixture => (
                <div 
                  key={fixture.id} 
                  className={`${styles.elementItem} ${selectedElement === fixture ? styles.selected : ''}`}
                  onClick={() => { setSelectedElement(fixture); setSelectedType('fixture'); }}
                >
                  <span>{fixture.type}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* AI Floor Plan Generator Dialog */}
      <FloorPlanGeneratorDialog
        open={showGeneratorDialog}
        onClose={() => setShowGeneratorDialog(false)}
        onGenerated={handleFloorPlanGenerated}
      />
    </div>
  );
};

export default MapEditor;
