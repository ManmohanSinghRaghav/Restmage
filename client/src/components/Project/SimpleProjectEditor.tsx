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
} from '@mui/icons-material';
import { Project } from '../../types';
import { projectsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useTheme } from '@mui/material/styles';

const SimpleProjectEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
<<<<<<< HEAD
  const theme = useTheme();
  
=======

>>>>>>> 93af25bc042d533010d982d8d0fd4e6fa273aca1
  const isNewProject = id === 'new';

  const [loading, setLoading] = useState(!isNewProject);
  const [saving, setSaving] = useState(false);
<<<<<<< HEAD
  const [calculating, setCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'materials' | 'cost'>('info');
  
=======

>>>>>>> 93af25bc042d533010d982d8d0fd4e6fa273aca1
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

  const [newMaterial, setNewMaterial] = useState({
    type: '',
    quantity: 0,
    unit: '',
    pricePerUnit: 0
  });

  const loadProject = useCallback(async () => {
    // Safety check: don't try to load "new" projects
    if (isNewProject || id === 'new') {
      console.log('📝 Creating new project - skipping load');
      return;
    }

    try {
      setLoading(true);
      console.log('📥 Loading project:', id);
      const projectData = await projectsAPI.getProject(id!);
      setProject(projectData);
      console.log('✅ Project loaded successfully:', projectData.name);
    } catch (error: any) {
      console.error('❌ Failed to load project:', error);
      showNotification(
        `Failed to load project: ${error.response?.data?.message || error.message || 'Unknown error'}`,
        'error'
      );
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
<<<<<<< HEAD
=======

>>>>>>> 93af25bc042d533010d982d8d0fd4e6fa273aca1
      if (isNewProject) {
        console.log('💾 Creating new project:', project.name);
        console.log('Project data:', JSON.stringify(project, null, 2));
        const savedProject = await projectsAPI.createProject(project);
        setProject(savedProject);
        console.log('✅ Project created:', savedProject._id);
        showNotification('Project created successfully', 'success');
        // Navigate to floor plan editor
        navigate(`/floorplan/${savedProject._id}`);
      } else {
        console.log('💾 Updating project:', project._id);
        const updatedProject = await projectsAPI.updateProject(project._id!, project);
        setProject(updatedProject);
        console.log('✅ Project updated:', updatedProject._id);
        showNotification('Project saved successfully', 'success');
        // Navigate to floor plan editor
        navigate(`/floorplan/${updatedProject._id}`);
      }
    } catch (error: any) {
      console.error('❌ Save failed:', error);
      const errorMessage = error.response?.data?.message
        || error.response?.data?.errors?.[0]?.msg
        || error.message
        || 'Unknown error';
      showNotification(`Failed to save project: ${errorMessage}`, 'error');
    } finally {
      setSaving(false);
    }
  };

<<<<<<< HEAD
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

=======
>>>>>>> 93af25bc042d533010d982d8d0fd4e6fa273aca1
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
      {/* LEFT PANE: MAP AREA */}
      <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
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
        
        {/* Floating Save Button on Map */}
        <Box sx={{ position: 'absolute', top: 20, right: 20, zIndex: 1000 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving}
            sx={{ 
              backdropFilter: 'blur(10px)',
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.8)',
              color: '#fff',
              '&:hover': {
                 backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.9)',
              }
            }}
          >
<<<<<<< HEAD
            {saving ? 'Saving...' : 'Save Workspace'}
=======
            {saving ? 'Saving...' : 'Next: Floor Plan'}
>>>>>>> 93af25bc042d533010d982d8d0fd4e6fa273aca1
          </Button>
        </Box>
      </Box>

      {/* RIGHT PANE: CONTROLS & INFO */}
      <Box sx={{ 
        width: '400px', 
        display: 'flex', 
        flexDirection: 'column',
        borderLeft: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(10,10,20,0.95)' : 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
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
                <TextField label="Length" type="number" size="small"
                  value={project.propertyDetails?.dimensions?.length || ''}
                  onChange={(e) => setProject(p => ({ ...p, propertyDetails: { ...p.propertyDetails!, dimensions: { ...p.propertyDetails!.dimensions, length: parseFloat(e.target.value) || 0 } } }))}
                />
                <TextField label="Width" type="number" size="small"
                  value={project.propertyDetails?.dimensions?.width || ''}
                  onChange={(e) => setProject(p => ({ ...p, propertyDetails: { ...p.propertyDetails!, dimensions: { ...p.propertyDetails!.dimensions, width: parseFloat(e.target.value) || 0 } } }))}
                />
              </Box>
              <FormControl fullWidth margin="normal" size="small">
                <InputLabel>Unit</InputLabel>
                <Select
                  value={project.propertyDetails?.dimensions?.unit || 'feet'}
                  onChange={(e) => setProject(p => ({ ...p, propertyDetails: { ...p.propertyDetails!, dimensions: { ...p.propertyDetails!.dimensions, unit: e.target.value as any } } }))}
                >
                  <MenuItem value="feet">Feet (ft)</MenuItem>
                  <MenuItem value="meters">Meters (m)</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Fade>

          {/* MATERIALS TAB */}
          <Fade in={activeTab === 'materials'} unmountOnExit>
            <Box sx={{ display: activeTab === 'materials' ? 'block' : 'none' }}>
              <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
                <Typography variant="subtitle2" gutterBottom>Add New Material</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 1.5 }}>
                  <TextField size="small" label="Material" value={newMaterial.type} onChange={e => setNewMaterial(p => ({ ...p, type: e.target.value }))} />
                  <TextField size="small" label="Qty" type="number" value={newMaterial.quantity} onChange={e => setNewMaterial(p => ({ ...p, quantity: parseFloat(e.target.value) || 0 }))} />
                  <TextField size="small" label="Unit (e.g. sqft)" value={newMaterial.unit} onChange={e => setNewMaterial(p => ({ ...p, unit: e.target.value }))} />
                  <TextField size="small" label="Price/Unit ($)" type="number" value={newMaterial.pricePerUnit} onChange={e => setNewMaterial(p => ({ ...p, pricePerUnit: parseFloat(e.target.value) || 0 }))} />
                </Box>
                <Button fullWidth variant="contained" color="secondary" startIcon={<AddIcon />} onClick={handleAddMaterial} disabled={!newMaterial.type || newMaterial.quantity <= 0}>
                  Add Material
                </Button>
              </Paper>

<<<<<<< HEAD
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Current Materials</Typography>
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
              {(!project.propertyDetails?.materials || project.propertyDetails.materials.length === 0) && (
                <Alert severity="info" sx={{ mt: 2 }}>No materials added.</Alert>
              )}
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
                  <Paper sx={{ p: 3, textAlign: 'center', mb: 2, background: theme.palette.mode === 'dark' ? 'linear-gradient(45deg, #1A1A2E 30%, #16213E 90%)' : 'linear-gradient(45deg, #f3f4f6 30%, #e5e7eb 90%)' }}>
                    <Typography variant="overline" color="text.secondary">Estimated Total</Typography>
                    <Typography variant="h3" color="primary" sx={{ fontWeight: 800 }}>
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
                  <Typography>Run the estimation engine to see your project's financial breakdown.</Typography>
                </Box>
              )}
            </Box>
          </Fade>

        </Box>
=======
        {/* Price Prediction / Market Value */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Market Price Prediction</Typography>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CalculateIcon />}
              onClick={() => navigate(`/price-prediction/${project._id}`)}
            >
              {project.activePricePrediction ? 'Update Prediction' : 'Predict Price'}
            </Button>
          </Box>

          {project.activePricePrediction ? (
            <Box sx={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <Box>
                <Typography variant="body2" color="textSecondary">Estimated Price</Typography>
                <Typography variant="h4" color="primary">
                  {/* Format as Lakhs/Crores if possible, or just locale string */}
                  {project.activePricePrediction.estimatedPrice >= 100000 ?
                    (project.activePricePrediction.estimatedPrice >= 10000000 ?
                      `₹${(project.activePricePrediction.estimatedPrice / 10000000).toFixed(2)} Cr` :
                      `₹${(project.activePricePrediction.estimatedPrice / 100000).toFixed(2)} L`)
                    : `₹${project.activePricePrediction.estimatedPrice.toLocaleString()}`}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">Confidence</Typography>
                <Typography variant="h6">
                  {(project.activePricePrediction.confidence * 100).toFixed(0)}%
                </Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body1" color="textSecondary" gutterBottom>
                No price prediction generated yet.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate(`/price-prediction/${project._id}`)}
                sx={{ mt: 1 }}
              >
                Get Market Estimate
              </Button>
            </Box>
          )}
        </Paper>

        {/* Materials */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>Materials</Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'end' }}>
            <TextField
              label="Material Type"
              value={newMaterial.type}
              onChange={(e) => setNewMaterial(prev => ({ ...prev, type: e.target.value }))}
            />
            <TextField
              label="Quantity"
              type="number"
              value={newMaterial.quantity}
              onChange={(e) => setNewMaterial(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
            />
            <TextField
              label="Unit"
              value={newMaterial.unit}
              onChange={(e) => setNewMaterial(prev => ({ ...prev, unit: e.target.value }))}
            />
            <TextField
              label="Price/Unit"
              type="number"
              value={newMaterial.pricePerUnit}
              onChange={(e) => setNewMaterial(prev => ({ ...prev, pricePerUnit: parseFloat(e.target.value) || 0 }))}
            />
            <IconButton
              color="primary"
              onClick={handleAddMaterial}
              disabled={!newMaterial.type || newMaterial.quantity <= 0}
            >
              <AddIcon />
            </IconButton>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Material</TableCell>
                  <TableCell>Quantity</TableCell>
                  <TableCell>Price/Unit</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {project.propertyDetails?.materials?.map((material, index) => (
                  <TableRow key={index}>
                    <TableCell>{material.type}</TableCell>
                    <TableCell>{material.quantity} {material.unit}</TableCell>
                    <TableCell>${(material.pricePerUnit || 0).toFixed(2)}</TableCell>
                    <TableCell>${((material.pricePerUnit || 0) * material.quantity).toFixed(2)}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setProject(prev => ({
                            ...prev,
                            propertyDetails: {
                              ...prev.propertyDetails!,
                              materials: prev.propertyDetails!.materials.filter((_, i) => i !== index)
                            }
                          }));
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {(!project.propertyDetails?.materials || project.propertyDetails.materials.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">No materials added yet</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Floor Plan Editor - REMOVED */}
        {/* The floor plan editor has been moved to a separate step in the workflow */}
>>>>>>> 93af25bc042d533010d982d8d0fd4e6fa273aca1
      </Box>
    </Box>
  );
};

export default SimpleProjectEditor;