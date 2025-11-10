import React, { useRef, useEffect, useState } from 'react';
import { Box, Button, Paper, AppBar, Toolbar, Typography, IconButton, Tooltip } from '@mui/material';
import { 
  Download as DownloadIcon, 
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  AttachMoney as PricingIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useNotification } from '../../contexts/NotificationContext';
import api from '../../services/api';

// Import styles
import './styles/main.css';
import './styles/panels.css';
import './styles/tools.css';
import './styles/styles.css';

interface MapEditorProps {
  initialData?: any;
}

const MapEditor: React.FC<MapEditorProps> = ({ initialData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [isExporting, setIsExporting] = useState(false);
  const [mapData, setMapData] = useState<any>(initialData || null);

  useEffect(() => {
    // Initialize the canvas and editor when component mounts
    if (canvasRef.current && containerRef.current) {
      initializeEditor();
    }

    return () => {
      // Cleanup on unmount
      cleanupEditor();
    };
  }, []);

  useEffect(() => {
    // Load data when initialData or projectId changes
    if (initialData) {
      loadMapData(initialData);
    } else if (projectId) {
      fetchProjectData(projectId);
    }
  }, [initialData, projectId]);

  const initializeEditor = () => {
    try {
      // Initialize canvas context
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Set canvas size
      const container = containerRef.current;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }

      // Load and execute the MapEditor initialization scripts
      // Note: These will be loaded globally when the component mounts
      if (window.initCanvas) {
        window.initCanvas();
      }
      if (window.initUI) {
        window.initUI();
      }
      if (window.initIO) {
        window.initIO();
      }

      showNotification('Map Editor initialized successfully', 'success');
    } catch (error) {
      console.error('Error initializing editor:', error);
      showNotification('Failed to initialize editor', 'error');
    }
  };

  const cleanupEditor = () => {
    // Cleanup any event listeners or resources
    if (window.cleanupEditor) {
      window.cleanupEditor();
    }
  };

  const loadMapData = (data: any) => {
    try {
      setMapData(data);
      
      // Load data into the editor
      if (window.loadFloorPlanData) {
        window.loadFloorPlanData(data);
      }
      
      showNotification('Map data loaded successfully', 'success');
    } catch (error) {
      console.error('Error loading map data:', error);
      showNotification('Failed to load map data', 'error');
    }
  };

  const fetchProjectData = async (id: string) => {
    try {
      const response = await api.get(`/projects/${id}`);
      if (response.data && response.data.mapData) {
        loadMapData(response.data.mapData);
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
      showNotification('Failed to load project data', 'error');
    }
  };

  const handleSave = async () => {
    try {
      // Get current state from editor
      const currentData = window.getEditorState ? window.getEditorState() : mapData;

      if (projectId) {
        await api.put(`/projects/${projectId}`, {
          mapData: currentData
        });
        showNotification('Map saved successfully', 'success');
      } else {
        showNotification('No project ID found', 'warning');
      }
    } catch (error) {
      console.error('Error saving map:', error);
      showNotification('Failed to save map', 'error');
    }
  };

  const handleExportImage = async () => {
    try {
      setIsExporting(true);
      const canvas = canvasRef.current;
      
      if (!canvas) {
        throw new Error('Canvas not found');
      }

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to create image');
        }

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `floorplan-${projectId || 'new'}-${Date.now()}.png`;
        link.href = url;
        link.click();
        
        URL.revokeObjectURL(url);
        showNotification('Image exported successfully', 'success');
      }, 'image/png');
    } catch (error) {
      console.error('Error exporting image:', error);
      showNotification('Failed to export image', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      const canvas = canvasRef.current;
      
      if (!canvas) {
        throw new Error('Canvas not found');
      }

      // Use html2canvas to capture the entire editor view
      const editorElement = containerRef.current;
      if (!editorElement) {
        throw new Error('Editor element not found');
      }

      const canvasImage = await html2canvas(editorElement, {
        scale: 2,
        backgroundColor: '#ffffff'
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvasImage.width, canvasImage.height]
      });

      const imgData = canvasImage.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, canvasImage.width, canvasImage.height);
      
      // Add metadata
      pdf.setProperties({
        title: `Floor Plan - ${projectId || 'New Project'}`,
        subject: 'Floor Plan Design',
        author: 'Restmage',
        creator: 'Restmage Map Editor'
      });

      pdf.save(`floorplan-${projectId || 'new'}-${Date.now()}.pdf`);
      showNotification('PDF exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      showNotification('Failed to export PDF', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleGetPricing = () => {
    // Navigate to pricing page with current map data
    if (projectId) {
      navigate(`/price-prediction?projectId=${projectId}`);
    } else {
      navigate('/price-prediction');
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Toolbar */}
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Floor Plan Editor
          </Typography>
          
          <Tooltip title="Save Map">
            <IconButton onClick={handleSave} color="primary">
              <SaveIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Get Pricing">
            <Button
              variant="outlined"
              startIcon={<PricingIcon />}
              onClick={handleGetPricing}
              sx={{ ml: 2 }}
            >
              Get Pricing
            </Button>
          </Tooltip>

          <Tooltip title="Export as Image">
            <IconButton 
              onClick={handleExportImage} 
              disabled={isExporting}
              sx={{ ml: 1 }}
            >
              <ImageIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Export as PDF">
            <IconButton 
              onClick={handleExportPDF} 
              disabled={isExporting}
              sx={{ ml: 1 }}
            >
              <PdfIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {/* Main Editor Container */}
      <Box
        ref={containerRef}
        sx={{
          flexGrow: 1,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#f5f5f5'
        }}
      >
        <canvas
          ref={canvasRef}
          id="floorCanvas"
          style={{
            width: '100%',
            height: '100%',
            display: 'block'
          }}
        />
      </Box>
    </Box>
  );
};

// Extend Window interface for editor functions
declare global {
  interface Window {
    initCanvas?: () => void;
    initUI?: () => void;
    initIO?: () => void;
    cleanupEditor?: () => void;
    loadFloorPlanData?: (data: any) => void;
    getEditorState?: () => any;
  }
}

export default MapEditor;
