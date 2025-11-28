import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Button, IconButton, Tooltip, Select, MenuItem,
  TextField, Tabs, Tab, Divider, List, ListItem, ListItemText, ListItemIcon,
  AppBar, Toolbar, Grid, FormControl, InputLabel, ListItemButton, CircularProgress
} from '@mui/material';
import {
  Undo, Redo, ZoomIn, ZoomOut, GridOn, Delete, Check, Home, Window as WindowIcon,
  CropSquare, Timeline, DoorFront, Chair, Download, Upload, AutoAwesome, Save, ArrowForward
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';
import FloorPlanGeneratorDialog from './FloorPlanGeneratorDialog';
import { floorPlansAPI } from '../../services/api';
import { FloorPlan } from '../../types/floorPlan.types';

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
  const { projectId, id: floorPlanId } = useParams<{ projectId: string; id: string }>();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showNotification } = useNotification();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentFloorPlanId, setCurrentFloorPlanId] = useState<string | null>(floorPlanId || null);

  // Load floor plan data
  useEffect(() => {
    const loadData = async () => {
      if (!projectId && !floorPlanId) return;
      
      setLoading(true);
      try {
        let floorPlan: FloorPlan | null = null;
        
        if (floorPlanId) {
          floorPlan = await floorPlansAPI.get(floorPlanId);
        } else if (projectId) {
          // If we only have projectId, try to get the latest floor plan
          const plans = await floorPlansAPI.list(projectId);
          if (plans && plans.length > 0) {
            // Sort by date descending
            plans.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            floorPlan = plans[0];
          }
        }
        
        if (floorPlan) {
          setCurrentFloorPlanId(floorPlan._id || null);
          
          // Map API response to editor state (handle both camelCase from DB and snake_case from AI)
          const fp = floorPlan as any;
          const mapInfoData = fp.map_info || fp.mapInfo || {};
          const plotSummaryData = fp.plot_summary || fp.plotSummary || {};
          
          setState(prev => ({
            ...prev,
            mapInfo: {
              title: mapInfoData.title || 'Floor Plan',
              author: mapInfoData.author || 'Architect',
              date: mapInfoData.date || new Date().toISOString().split('T')[0],
              scale: mapInfoData.scale || '1:100',
              north_direction: mapInfoData.north_direction || 'Top of map',
            },
            plotSummary: {
              plot_length_ft: plotSummaryData.plot_length_ft || 50,
              plot_width_ft: plotSummaryData.plot_width_ft || 30,
              setback_front_ft: plotSummaryData.setback_front_ft || 5,
              setback_rear_ft: plotSummaryData.setback_rear_ft || 3,
              setback_side_left_ft: plotSummaryData.setback_side_left_ft || 3,
              setback_side_right_ft: plotSummaryData.setback_side_right_ft || 3,
            },
            rooms: (fp.rooms || []).map((r: any, i: number) => ({
              ...r,
              id: r.id || `room-${Date.now()}-${i}`,
              polygon: r.polygon
            })),
            walls: (fp.walls || []).map((w: any, i: number) => ({
              ...w,
              id: w.id || `wall-${Date.now()}-${i}`
            })),
            doors: (fp.doors || []).map((d: any, i: number) => ({
              ...d,
              id: d.id || `door-${Date.now()}-${i}`
            })),
            windows: (fp.windows || []).map((w: any, i: number) => ({
              ...w,
              id: w.id || `window-${Date.now()}-${i}`
            })),
            fixtures: (fp.fixtures || []).map((f: any, i: number) => ({
              ...f,
              id: f.id || `fixture-${Date.now()}-${i}`
            })),
          }));
          
          showNotification('Floor plan loaded successfully', 'success');
        }
      } catch (error) {
        console.error('Failed to load floor plan:', error);
        // Don't show error if it's just 404 (no floor plan yet)
        // showNotification('Failed to load floor plan', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, floorPlanId]);

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
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
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
  }, [state]);

  const drawPlotBoundary = useCallback((ctx: CanvasRenderingContext2D) => {
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
  }, [state.plotSummary, feetToScreen]);

  const drawRoom = useCallback((ctx: CanvasRenderingContext2D, room: Room, selected: boolean) => {
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
  }, [state.zoom, feetToScreen]);

  const drawWall = useCallback((ctx: CanvasRenderingContext2D, wall: Wall, selected: boolean) => {
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
  }, [state.scale, state.zoom, feetToScreen]);

  const drawDoor = useCallback((ctx: CanvasRenderingContext2D, door: Door, selected: boolean) => {
    if (!door || !door.position) return;

    const pos = feetToScreen(door.position.x_ft, door.position.y_ft);
    const width = door.width * state.scale * state.zoom;

    ctx.fillStyle = selected ? '#e74c3c' : '#9b59b6';
    ctx.fillRect(pos.x - width / 2, pos.y - 5, width, 10);
    
    ctx.strokeStyle = '#6c3483';
    ctx.lineWidth = 2;
    ctx.strokeRect(pos.x - width / 2, pos.y - 5, width, 10);
  }, [state.scale, state.zoom, feetToScreen]);

  const drawWindow = useCallback((ctx: CanvasRenderingContext2D, window: Window, selected: boolean) => {
    if (!window || !window.position) return;

    const pos = feetToScreen(window.position.x_ft, window.position.y_ft);
    const width = window.width * state.scale * state.zoom;

    ctx.fillStyle = selected ? '#e74c3c' : '#2196F3';
    ctx.fillRect(pos.x - width / 2, pos.y - 5, width, 10);
    
    ctx.strokeStyle = '#1565C0';
    ctx.lineWidth = 2;
    ctx.strokeRect(pos.x - width / 2, pos.y - 5, width, 10);
  }, [state.scale, state.zoom, feetToScreen]);

  const drawFixture = useCallback((ctx: CanvasRenderingContext2D, fixture: Fixture, selected: boolean) => {
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
  }, [state.zoom, feetToScreen]);

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
  }, [state, selectedElement, activeTool, isDrawing, drawingPoints, tempStart, feetToScreen, drawGrid, drawPlotBoundary, drawRoom, drawWall, drawDoor, drawWindow, drawFixture]);

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

  const handleSave = async (navigateToNext = false) => {
    if (!projectId && !currentFloorPlanId) {
      showNotification('Cannot save: No project ID', 'error');
      return;
    }

    setSaving(true);
    try {
      const floorPlanData: Partial<FloorPlan> = {
        project: projectId!,
        map_info: state.mapInfo,
        plot_summary: state.plotSummary,
        rooms: state.rooms.map(r => ({
            name: r.name,
            type: r.type,
            polygon: r.polygon
        })),
        walls: state.walls.map(w => ({
            start: w.start,
            end: w.end,
            thickness_ft: 0.5 // Default thickness
        })),
        doors: state.doors.map(d => ({
            position: d.position,
            width_ft: d.width,
            swing: 'left' // Default swing
        })),
        windows: state.windows.map(w => ({
            position: w.position,
            width_ft: w.width
        })),
        fixtures: state.fixtures,
      };

      let savedPlan;
      if (currentFloorPlanId) {
        savedPlan = await floorPlansAPI.update(currentFloorPlanId, floorPlanData);
      } else {
        savedPlan = await floorPlansAPI.create(floorPlanData);
        setCurrentFloorPlanId(savedPlan._id!);
      }

      showNotification('Floor plan saved successfully', 'success');
      
      if (navigateToNext) {
        if (projectId) {
          const fpId = savedPlan?._id || currentFloorPlanId;
          navigate(`/price-prediction/${projectId}${fpId ? `/${fpId}` : ''}`);
        } else {
          showNotification('No project ID for navigation', 'warning');
        }
      }
    } catch (error) {
      console.error('Failed to save floor plan:', error);
      showNotification('Failed to save floor plan', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)', bgcolor: 'background.default' }}>
      {/* Toolbar */}
      <AppBar position="static" color="default" elevation={1} sx={{ zIndex: 1201 }}>
        <Toolbar variant="dense">
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Home fontSize="small" />
            Floor Plan Editor
            <Typography variant="caption" sx={{ bgcolor: 'action.selected', px: 1, borderRadius: 1 }}>v2.0</Typography>
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Undo (Ctrl+Z)">
              <span>
                <IconButton onClick={undo} disabled={historyIndex <= 0} size="small">
                  <Undo />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Redo (Ctrl+Y)">
              <span>
                <IconButton onClick={redo} disabled={historyIndex >= history.length - 1} size="small">
                  <Redo />
                </IconButton>
              </span>
            </Tooltip>
            
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            
            <Button 
              startIcon={<Upload />} 
              onClick={() => fileInputRef.current?.click()}
              size="small"
            >
              Import
            </Button>
            <Button 
              startIcon={<Download />} 
              onClick={handleExport}
              size="small"
            >
              Export
            </Button>
            
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

            <Button 
              variant="contained" 
              color="primary"
              startIcon={<Save />}
              onClick={() => handleSave(false)}
              disabled={saving}
              size="small"
              sx={{ mr: 1 }}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>

            <Button 
              variant="contained" 
              color="secondary"
              endIcon={<ArrowForward />}
              onClick={() => handleSave(true)}
              disabled={saving}
              size="small"
            >
              Next: Price
            </Button>
            
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            
            <Button 
              variant="contained" 
              color="success"
              startIcon={<AutoAwesome />}
              onClick={() => setShowGeneratorDialog(true)}
              size="small"
            >
              Generate with AI
            </Button>
            <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
          </Box>
        </Toolbar>
      </AppBar>

      {/* Tools Bar */}
      <Paper square elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Select (V)">
            <Button 
              variant={activeTool === 'select' ? 'contained' : 'outlined'} 
              onClick={() => setActiveTool('select')}
              size="small"
              startIcon={<Check />}
            >
              Select
            </Button>
          </Tooltip>
          <Tooltip title="Draw Room (R)">
            <Button 
              variant={activeTool === 'room' ? 'contained' : 'outlined'} 
              onClick={() => setActiveTool('room')}
              size="small"
              startIcon={<CropSquare />}
            >
              Room
            </Button>
          </Tooltip>
          <Tooltip title="Draw Wall (W)">
            <Button 
              variant={activeTool === 'wall' ? 'contained' : 'outlined'} 
              onClick={() => setActiveTool('wall')}
              size="small"
              startIcon={<Timeline />}
            >
              Wall
            </Button>
          </Tooltip>
          <Tooltip title="Add Door (D)">
            <Button 
              variant={activeTool === 'door' ? 'contained' : 'outlined'} 
              onClick={() => setActiveTool('door')}
              size="small"
              startIcon={<DoorFront />}
            >
              Door
            </Button>
          </Tooltip>
          <Tooltip title="Add Window (N)">
            <Button 
              variant={activeTool === 'window' ? 'contained' : 'outlined'} 
              onClick={() => setActiveTool('window')}
              size="small"
              startIcon={<WindowIcon />}
            >
              Window
            </Button>
          </Tooltip>
          <Tooltip title="Add Fixture (F)">
            <Button 
              variant={activeTool === 'fixture' ? 'contained' : 'outlined'} 
              onClick={() => setActiveTool('fixture')}
              size="small"
              startIcon={<Chair />}
            >
              Fixture
            </Button>
          </Tooltip>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Zoom In (+)">
            <IconButton onClick={handleZoomIn} size="small"><ZoomIn /></IconButton>
          </Tooltip>
          <Tooltip title="Zoom Out (-)">
            <IconButton onClick={handleZoomOut} size="small"><ZoomOut /></IconButton>
          </Tooltip>
          <Tooltip title="Fit View (F)">
            <IconButton onClick={handleFitView} size="small"><GridOn /></IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {/* Main Content */}
      <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        <Box sx={{ flexGrow: 1, position: 'relative', bgcolor: '#f0f0f0' }}>
          <canvas 
            ref={canvasRef} 
            style={{ width: '100%', height: '100%', display: 'block', cursor: activeTool === 'select' ? 'default' : 'crosshair' }}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            onContextMenu={handleCanvasRightClick}
          />
          <Paper sx={{ position: 'absolute', bottom: 16, left: 16, px: 1, py: 0.5, opacity: 0.8 }}>
            <Typography variant="caption">{canvasCoords}</Typography>
          </Paper>
        </Box>

        {/* Sidebar */}
        <Paper square elevation={2} sx={{ width: 320, display: 'flex', flexDirection: 'column', borderLeft: 1, borderColor: 'divider', overflowY: 'auto' }}>
          {/* Map Info Panel */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom>Map Information</Typography>
            <Grid container spacing={2}>
              <Grid size={12}>
                <TextField 
                  label="Title" 
                  fullWidth 
                  size="small" 
                  value={state.mapInfo.title}
                  onChange={(e) => setState(prev => ({ ...prev, mapInfo: { ...prev.mapInfo, title: e.target.value } }))}
                />
              </Grid>
              <Grid size={12}>
                <TextField 
                  label="Author" 
                  fullWidth 
                  size="small" 
                  value={state.mapInfo.author}
                  onChange={(e) => setState(prev => ({ ...prev, mapInfo: { ...prev.mapInfo, author: e.target.value } }))}
                />
              </Grid>
              <Grid size={6}>
                <TextField 
                  label="Date" 
                  type="date" 
                  fullWidth 
                  size="small" 
                  InputLabelProps={{ shrink: true }}
                  value={state.mapInfo.date}
                  onChange={(e) => setState(prev => ({ ...prev, mapInfo: { ...prev.mapInfo, date: e.target.value } }))}
                />
              </Grid>
              <Grid size={6}>
                <TextField 
                  label="Scale" 
                  fullWidth 
                  size="small" 
                  value={state.mapInfo.scale}
                  onChange={(e) => setState(prev => ({ ...prev, mapInfo: { ...prev.mapInfo, scale: e.target.value } }))}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Plot Settings Panel */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom>Plot Settings</Typography>
            <Grid container spacing={2}>
              <Grid size={6}>
                <TextField 
                  label="Length (ft)" 
                  type="number" 
                  fullWidth 
                  size="small" 
                  value={state.plotSummary.plot_length_ft}
                  onChange={(e) => setState(prev => ({ ...prev, plotSummary: { ...prev.plotSummary, plot_length_ft: parseFloat(e.target.value) } }))}
                />
              </Grid>
              <Grid size={6}>
                <TextField 
                  label="Width (ft)" 
                  type="number" 
                  fullWidth 
                  size="small" 
                  value={state.plotSummary.plot_width_ft}
                  onChange={(e) => setState(prev => ({ ...prev, plotSummary: { ...prev.plotSummary, plot_width_ft: parseFloat(e.target.value) } }))}
                />
              </Grid>
              <Grid size={12}>
                <Typography variant="caption" color="textSecondary">Setbacks (ft)</Typography>
                <Grid container spacing={1}>
                  <Grid size={3}>
                    <TextField 
                      label="Front" 
                      type="number" 
                      size="small" 
                      value={state.plotSummary.setback_front_ft}
                      onChange={(e) => setState(prev => ({ ...prev, plotSummary: { ...prev.plotSummary, setback_front_ft: parseFloat(e.target.value) } }))}
                    />
                  </Grid>
                  <Grid size={3}>
                    <TextField 
                      label="Rear" 
                      type="number" 
                      size="small" 
                      value={state.plotSummary.setback_rear_ft}
                      onChange={(e) => setState(prev => ({ ...prev, plotSummary: { ...prev.plotSummary, setback_rear_ft: parseFloat(e.target.value) } }))}
                    />
                  </Grid>
                  <Grid size={3}>
                    <TextField 
                      label="Left" 
                      type="number" 
                      size="small" 
                      value={state.plotSummary.setback_side_left_ft}
                      onChange={(e) => setState(prev => ({ ...prev, plotSummary: { ...prev.plotSummary, setback_side_left_ft: parseFloat(e.target.value) } }))}
                    />
                  </Grid>
                  <Grid size={3}>
                    <TextField 
                      label="Right" 
                      type="number" 
                      size="small" 
                      value={state.plotSummary.setback_side_right_ft}
                      onChange={(e) => setState(prev => ({ ...prev, plotSummary: { ...prev.plotSummary, setback_side_right_ft: parseFloat(e.target.value) } }))}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>

          {/* Summary Panel */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle2" gutterBottom>Summary</Typography>
            <Grid container spacing={1}>
              <Grid size={6}><Typography variant="body2">Plot Area: {plotArea.toFixed(0)} sqft</Typography></Grid>
              <Grid size={6}><Typography variant="body2">Built-up: {totalBuiltUpArea.toFixed(0)} sqft</Typography></Grid>
              <Grid size={6}><Typography variant="body2">Coverage: {coverage}%</Typography></Grid>
              <Grid size={6}><Typography variant="body2">Rooms: {state.rooms.length}</Typography></Grid>
            </Grid>
          </Box>

          {/* Properties Panel */}
          {selectedElement && (
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2">Properties</Typography>
                <IconButton size="small" color="error" onClick={deleteSelectedElement}><Delete fontSize="small" /></IconButton>
              </Box>
              
              {selectedType === 'room' && (
                <Grid container spacing={2}>
                  <Grid size={12}>
                    <TextField 
                      label="Name" 
                      fullWidth 
                      size="small" 
                      value={selectedElement.name}
                      onChange={(e) => {
                        selectedElement.name = e.target.value;
                        setState({...state});
                      }}
                    />
                  </Grid>
                  <Grid size={12}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Type</InputLabel>
                      <Select 
                        value={selectedElement.type}
                        label="Type"
                        onChange={(e) => {
                          selectedElement.type = e.target.value;
                          setState({...state});
                        }}
                      >
                        {ROOM_TYPES.map(type => (
                          <MenuItem key={type} value={type}>{type.replace('_', ' ')}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={12}>
                    <Typography variant="body2">Area: {calculatePolygonArea(selectedElement.polygon).toFixed(1)} sqft</Typography>
                  </Grid>
                </Grid>
              )}
              {selectedType === 'fixture' && activeTool === 'fixture' && (
                <FormControl fullWidth size="small">
                  <InputLabel>Fixture Type</InputLabel>
                  <Select 
                    value={selectedFixtureType}
                    label="Fixture Type"
                    onChange={(e) => setSelectedFixtureType(e.target.value)}
                  >
                    {FIXTURE_TYPES.map(type => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
          )}

          {/* Elements Panel */}
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Tabs 
              value={activeTab} 
              onChange={(_, v) => setActiveTab(v)} 
              variant="fullWidth" 
              indicatorColor="primary"
              textColor="primary"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Rooms" value="rooms" />
              <Tab label="Walls" value="walls" />
              <Tab label="Openings" value="openings" />
              <Tab label="Fixtures" value="fixtures" />
            </Tabs>
            
            <List dense sx={{ flexGrow: 1, overflowY: 'auto' }}>
              {activeTab === 'rooms' && state.rooms.map(room => (
                <ListItem key={room.id} disablePadding>
                  <ListItemButton 
                    selected={selectedElement === room}
                    onClick={() => { setSelectedElement(room); setSelectedType('room'); }}
                  >
                    <ListItemIcon><CropSquare /></ListItemIcon>
                    <ListItemText primary={room.name} secondary={room.type} />
                  </ListItemButton>
                </ListItem>
              ))}
              
              {activeTab === 'walls' && state.walls.map(wall => (
                <ListItem key={wall.id} disablePadding>
                  <ListItemButton 
                    selected={selectedElement === wall}
                    onClick={() => { setSelectedElement(wall); setSelectedType('wall'); }}
                  >
                    <ListItemIcon><Timeline /></ListItemIcon>
                    <ListItemText primary="Wall" />
                  </ListItemButton>
                </ListItem>
              ))}

              {activeTab === 'openings' && [...state.doors, ...state.windows].map(item => (
                <ListItem key={item.id} disablePadding>
                  <ListItemButton 
                    selected={selectedElement === item}
                    onClick={() => { setSelectedElement(item); setSelectedType('door' in item ? 'door' : 'window'); }}
                  >
                    <ListItemIcon>{'swing' in item ? <DoorFront /> : <WindowIcon />}</ListItemIcon>
                    <ListItemText primary={'swing' in item ? 'Door' : 'Window'} />
                  </ListItemButton>
                </ListItem>
              ))}

              {activeTab === 'fixtures' && state.fixtures.map(fixture => (
                <ListItem key={fixture.id} disablePadding>
                  <ListItemButton 
                    selected={selectedElement === fixture}
                    onClick={() => { setSelectedElement(fixture); setSelectedType('fixture'); }}
                  >
                    <ListItemIcon><Chair /></ListItemIcon>
                    <ListItemText primary={fixture.type} />
                  </ListItemButton>
                </ListItem>
              ))}
              
              {/* Empty states */}
              {activeTab === 'rooms' && state.rooms.length === 0 && <ListItem><ListItemText primary="No rooms yet" /></ListItem>}
              {activeTab === 'walls' && state.walls.length === 0 && <ListItem><ListItemText primary="No walls yet" /></ListItem>}
              {activeTab === 'openings' && state.doors.length === 0 && state.windows.length === 0 && <ListItem><ListItemText primary="No openings yet" /></ListItem>}
              {activeTab === 'fixtures' && state.fixtures.length === 0 && <ListItem><ListItemText primary="No fixtures yet" /></ListItem>}
            </List>
          </Box>
        </Paper>
      </Box>

      {/* AI Floor Plan Generator Dialog */}
      <FloorPlanGeneratorDialog
        open={showGeneratorDialog}
        onClose={() => setShowGeneratorDialog(false)}
        onGenerated={handleFloorPlanGenerated}
      />
    </Box>
  );
};

export default MapEditor;
