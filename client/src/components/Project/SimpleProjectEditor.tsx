import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Divider,
  Fade,
  Paper,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Calculate as CalculateIcon,
  Layers as LayersIcon,
  Map as MapIcon,
  AttachMoney as MoneyIcon,
  Architecture as ArchIcon,
  AutoAwesome as AIIcon,
} from '@mui/icons-material';
import { Project } from '../../types';
import { projectsAPI, costAPI, aiAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useTheme } from '@mui/material/styles';
import InteractiveMap from './InteractiveMap';

const SimpleProjectEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const theme = useTheme();
  
  const isNewProject = id === 'new';

  const [loading, setLoading] = useState(!isNewProject);
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'materials' | 'cost' | 'floorplan'>('info');
  
  const [project, setProject] = useState<Partial<Project>>({
    name: '',
    description: '',
    propertyDetails: {
      type: 'residential',
      location: {
        address: '',
        city: '',
        state: '',
        zipCode: '',
        coordinates: { lat: 40.7128, lng: -74.0060 }
      },
      dimensions: { length: 0, width: 0, height: 0, unit: 'feet' },
      materials: []
    },
    mapData: {
      center: { lat: 40.7128, lng: -74.0060 },
      zoom: 13,
      bounds: [],
      layers: []
    },
    status: 'draft'
  });

  const [aiFloorplan, setAiFloorplan] = useState<any>(null);

  const [newMaterial, setNewMaterial] = useState({
    type: '',
    quantity: 0,
    unit: '',
    pricePerUnit: 0
  });

  const loadProject = useCallback(async () => {
    if (isNewProject || id === 'new') return;

    try {
      setLoading(true);
      const projectData = await projectsAPI.getProject(id!);
      setProject(projectData);
    } catch (error: any) {
      showNotification(`Failed to load project: ${error.message}`, 'error');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, isNewProject, showNotification, navigate]);

  useEffect(() => {
    if (!isNewProject) {
      loadProject();
    }
  }, [isNewProject, loadProject]);

  const handleSave = async () => {
    try {
      setSaving(true);
      if (isNewProject) {
        const savedProject = await projectsAPI.createProject(project);
        setProject(savedProject);
        showNotification('Project created successfully', 'success');
        navigate(`/projects/${savedProject._id}`);
      } else {
        const updatedProject = await projectsAPI.updateProject(project._id!, project);
        setProject(updatedProject);
        showNotification('Project saved successfully', 'success');
      }
    } catch (error: any) {
      showNotification(`Failed to save project: ${error.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCalculateCost = async () => {
    if (!project._id) {
      showNotification('Please save the project first', 'warning');
      return;
    }
    try {
      setCalculating(true);
      const costEstimation = await costAPI.calculateCost(project._id);
      setProject(prev => ({ ...prev, costEstimation }));
      setActiveTab('cost');
      showNotification('Cost estimation calculated successfully', 'success');
    } catch (error) {
      showNotification('Failed to calculate cost', 'error');
    } finally {
      setCalculating(false);
    }
  };

  const handleGenerateAI = async () => {
    const width = project.propertyDetails?.dimensions?.width || 0;
    const height = project.propertyDetails?.dimensions?.length || 0;

    if (width <= 0 || height <= 0) {
      showNotification('Please provide property dimensions (Width & Length) first', 'warning');
      setActiveTab('info');
      return;
    }

    try {
      setGeneratingAI(true);
      const result = await aiAPI.generateFloorplan({
        width,
        height,
        rooms: project.propertyDetails?.type === 'residential' ? '3 bedrooms, living, kitchen' : 'Office spaces, lobby',
        style: 'modern'
      });
      setAiFloorplan(result);
      setActiveTab('floorplan');
      showNotification('AI Floorplan generated successfully!', 'success');
    } catch (error: any) {
      showNotification(`AI Generation failed: ${error.message}`, 'error');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleAddMaterial = () => {
    if (newMaterial.type && newMaterial.quantity > 0) {
      setProject(prev => ({
        ...prev,
        propertyDetails: {
          ...prev.propertyDetails!,
          materials: [...(prev.propertyDetails?.materials || []), { ...newMaterial }]
        }
      }));
      setNewMaterial({ type: '', quantity: 0, unit: '', pricePerUnit: 0 });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} thickness={4} color="primary" />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      display: 'flex', 
      height: 'calc(100vh - 80px)', 
      overflow: 'hidden',
      borderRadius: theme.shape.borderRadius,
      boxShadow: theme.shadows[10],
      bgcolor: 'background.paper',
      position: 'relative'
    }}>
      {/* LEFT PANE: MAP/VISUALIZER AREA */}
      <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden', bgcolor: '#000' }}>
        {activeTab === 'floorplan' && aiFloorplan ? (
          <Box sx={{ p: 4, height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Paper elevation={10} sx={{ 
              p: 2, 
              width: '80%', 
              height: '80%', 
              position: 'relative', 
              bgcolor: '#fff', 
              border: '2px solid #333',
              borderRadius: theme.palette.mode === 'cyberpunk' ? 0 : 2
            }}>
              <Typography variant="h6" color="black" align="center" sx={{ mb: 2, fontWeight: 800 }}>AI GENERATED FLOORPLAN (TOP VIEW)</Typography>
              <Box sx={{ 
                position: 'relative', 
                width: '100%', 
                height: 'calc(100% - 40px)', 
                border: '1px dashed #ccc',
                bgcolor: '#f9f9f9'
              }}>
                {aiFloorplan.rooms.map((room: any, i: number) => (
                  <Box key={i} sx={{
                    position: 'absolute',
                    left: `${(room.x / aiFloorplan.dimensions.width) * 100}%`,
                    top: `${(room.y / aiFloorplan.dimensions.height) * 100}%`,
                    width: `${(room.width / aiFloorplan.dimensions.width) * 100}%`,
                    height: `${(room.height / aiFloorplan.dimensions.height) * 100}%`,
                    border: '2px solid #333',
                    bgcolor: room.color || 'rgba(0,0,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s'
                  }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#333', fontSize: '10px' }}>{room.name}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>
        ) : (
          <InteractiveMap
            center={[project.mapData?.center?.lat || 40.7128, project.mapData?.center?.lng || -74.0060]}
            zoom={project.mapData?.zoom || 13}
            layers={project.mapData?.layers || []}
            onLayerAdd={(layer) => setProject(prev => ({
              ...prev,
              mapData: { ...prev.mapData!, layers: [...prev.mapData!.layers, layer] }
            }))}
            onLayerDelete={(layerId) => setProject(prev => ({
              ...prev,
              mapData: { ...prev.mapData!, layers: prev.mapData!.layers.filter(l => l.id !== layerId) }
            }))}
            onMapUpdate={(center, zoom) => setProject(prev => ({
              ...prev,
              mapData: { ...prev.mapData!, center: { lat: center[0], lng: center[1] }, zoom }
            }))}
            editable={true}
          />
        )}
        
        {/* Floating Actions on Visualizer */}
        <Box sx={{ position: 'absolute', top: 20, right: 20, zIndex: 1000, display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="secondary"
            startIcon={generatingAI ? <CircularProgress size={20} color="inherit" /> : <AIIcon />}
            onClick={handleGenerateAI}
            disabled={generatingAI}
            sx={{ backdropFilter: 'blur(10px)', fontWeight: 700 }}
          >
            {generatingAI ? 'Thinking...' : 'Generate AI Floorplan'}
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving}
            sx={{ backdropFilter: 'blur(10px)', fontWeight: 700 }}
          >
            {saving ? 'Saving...' : 'Save Workspace'}
          </Button>
        </Box>
      </Box>

      {/* RIGHT PANE: CONTROLS & INFO */}
      <Box sx={{ 
        width: '400px', 
        display: 'flex', 
        flexDirection: 'column',
        borderLeft: `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
        zIndex: 10,
        boxShadow: '-10px 0 30px rgba(0,0,0,0.1)'
      }}>
        {/* Workspace Header */}
        <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
            {project.name || 'Untitled Project'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isNewProject ? 'Setup your new real estate workspace' : `Editing project details`}
          </Typography>
        </Box>

        {/* Custom Tabs */}
        <Box sx={{ display: 'flex', borderBottom: `1px solid ${theme.palette.divider}` }}>
          {[
            { id: 'info', icon: <ArchIcon fontSize="small" />, label: 'Details' },
            { id: 'materials', icon: <LayersIcon fontSize="small" />, label: 'Materials' },
            { id: 'cost', icon: <MoneyIcon fontSize="small" />, label: 'Costing' },
            { id: 'floorplan', icon: <AIIcon fontSize="small" />, label: 'AI Plan' },
          ].map(tab => (
            <Box
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              sx={{
                flex: 1,
                py: 1.5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                color: activeTab === tab.id ? 'primary.main' : 'text.secondary',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              {tab.icon}
              <Typography variant="caption" sx={{ mt: 0.5, fontWeight: activeTab === tab.id ? 700 : 500 }}>
                {tab.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Tab Content Area (Scrollable) */}
        <Box sx={{ p: 3, flex: 1, overflowY: 'auto' }}>
          
          {/* INFO TAB */}
          <Fade in={activeTab === 'info'} unmountOnExit>
            <Box sx={{ display: activeTab === 'info' ? 'block' : 'none' }}>
              <TextField
                fullWidth label="Project Name" variant="outlined" margin="normal"
                value={project.name || ''} onChange={(e) => setProject(p => ({ ...p, name: e.target.value }))}
              />
              <TextField
                fullWidth label="Description" variant="outlined" margin="normal" multiline rows={3}
                value={project.description || ''} onChange={(e) => setProject(p => ({ ...p, description: e.target.value }))}
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Property Type</InputLabel>
                <Select
                  value={project.propertyDetails?.type || 'residential'}
                  onChange={(e) => setProject(p => ({ ...p, propertyDetails: { ...p.propertyDetails!, type: e.target.value as any } }))}
                >
                  <MenuItem value="residential">Residential</MenuItem>
                  <MenuItem value="commercial">Commercial</MenuItem>
                  <MenuItem value="industrial">Industrial</MenuItem>
                </Select>
              </FormControl>
              
              <Divider sx={{ my: 3 }}><Typography variant="caption" color="text.secondary">DIMENSIONS</Typography></Divider>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField label="Length (m)" type="number" size="small"
                  value={project.propertyDetails?.dimensions?.length || ''}
                  onChange={(e) => setProject(p => ({ ...p, propertyDetails: { ...p.propertyDetails!, dimensions: { ...p.propertyDetails!.dimensions, length: parseFloat(e.target.value) || 0 } } }))}
                />
                <TextField label="Width (m)" type="number" size="small"
                  value={project.propertyDetails?.dimensions?.width || ''}
                  onChange={(e) => setProject(p => ({ ...p, propertyDetails: { ...p.propertyDetails!, dimensions: { ...p.propertyDetails!.dimensions, width: parseFloat(e.target.value) || 0 } } }))}
                />
              </Box>
            </Box>
          </Fade>

          {/* MATERIALS TAB */}
          <Fade in={activeTab === 'materials'} unmountOnExit>
            <Box sx={{ display: activeTab === 'materials' ? 'block' : 'none' }}>
              <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>Add New Material</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 1.5 }}>
                  <TextField size="small" label="Material" value={newMaterial.type} onChange={e => setNewMaterial(p => ({ ...p, type: e.target.value }))} />
                  <TextField size="small" label="Qty" type="number" value={newMaterial.quantity} onChange={e => setNewMaterial(p => ({ ...p, quantity: parseFloat(e.target.value) || 0 }))} />
                  <TextField size="small" label="Unit" value={newMaterial.unit} onChange={e => setNewMaterial(p => ({ ...p, unit: e.target.value }))} />
                  <TextField size="small" label="Price/Unit ($)" type="number" value={newMaterial.pricePerUnit} onChange={e => setNewMaterial(p => ({ ...p, pricePerUnit: parseFloat(e.target.value) || 0 }))} />
                </Box>
                <Button fullWidth variant="contained" color="secondary" startIcon={<AddIcon />} onClick={handleAddMaterial} disabled={!newMaterial.type || newMaterial.quantity <= 0}>
                  Add to List
                </Button>
              </Paper>

              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Material Breakdown</Typography>
              {project.propertyDetails?.materials?.map((mat, idx) => (
                <Paper key={idx} variant="outlined" sx={{ p: 1.5, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{mat.type}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {mat.quantity} {mat.unit} @ ${mat.pricePerUnit}/unit
                    </Typography>
                  </Box>
                  <IconButton size="small" color="error" onClick={() => setProject(p => ({
                    ...p, propertyDetails: { ...p.propertyDetails!, materials: p.propertyDetails!.materials.filter((_, i) => i !== idx) }
                  }))}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Paper>
              ))}
            </Box>
          </Fade>

          {/* COSTING TAB */}
          <Fade in={activeTab === 'cost'} unmountOnExit>
            <Box sx={{ display: activeTab === 'cost' ? 'block' : 'none' }}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                startIcon={calculating ? <CircularProgress size={20} color="inherit" /> : <CalculateIcon />}
                onClick={handleCalculateCost}
                disabled={calculating}
                sx={{ mb: 3 }}
              >
                {calculating ? 'Calculating Engine...' : 'Run Cost Estimation'}
              </Button>

              {project.costEstimation ? (
                <Box>
                  <Paper sx={{ p: 3, textAlign: 'center', mb: 2, background: theme.palette.primary.main, color: 'primary.contrastText' }}>
                    <Typography variant="overline" sx={{ opacity: 0.8 }}>Estimated Total</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800 }}>
                      ${project.costEstimation.total.toLocaleString()}
                    </Typography>
                  </Paper>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">Materials</Typography>
                      <Typography variant="h6">${project.costEstimation.materials.toLocaleString()}</Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">Labor</Typography>
                      <Typography variant="h6">${project.costEstimation.labor.toLocaleString()}</Typography>
                    </Paper>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 5, opacity: 0.5 }}>
                  <MoneyIcon sx={{ fontSize: 60, mb: 2 }} />
                  <Typography>Run estimation to see your project's financial breakdown.</Typography>
                </Box>
              )}
            </Box>
          </Fade>

          {/* FLOORPLAN TAB */}
          <Fade in={activeTab === 'floorplan'} unmountOnExit>
            <Box sx={{ display: activeTab === 'floorplan' ? 'block' : 'none' }}>
              {aiFloorplan ? (
                <Box>
                  <Alert severity="success" sx={{ mb: 2 }}>AI Layout Generated!</Alert>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Gemini has designed a functional layout based on your {project.propertyDetails?.dimensions?.width}x{project.propertyDetails?.dimensions?.length}m space.
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Room</TableCell>
                          <TableCell>Size (m)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {aiFloorplan.rooms.map((room: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell sx={{ fontSize: '0.75rem' }}>{room.name}</TableCell>
                            <TableCell sx={{ fontSize: '0.75rem' }}>{room.width}x{room.height}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 5, opacity: 0.5 }}>
                  <AIIcon sx={{ fontSize: 60, mb: 2 }} />
                  <Typography>Click 'Generate AI Floorplan' to create a layout with Gemini API.</Typography>
                </Box>
              )}
            </Box>
          </Fade>

        </Box>
      </Box>
    </Box>
  );
};

export default SimpleProjectEditor;