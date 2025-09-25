import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Calculate as CalculateIcon,
} from '@mui/icons-material';
import InteractiveMap from '../Map/InteractiveMap';
import { Project } from '../../types';
import { projectsAPI, costAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useSocket } from '../../contexts/SocketContext';

const ProjectEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { socket } = useSocket();
  
  const isNewProject = id === 'new';
  
  const [loading, setLoading] = useState(!isNewProject);
  const [saving, setSaving] = useState(false);
  const [calculating, setCalculating] = useState(false);
  
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
      dimensions: {
        length: 0,
        width: 0,
        height: 0,
        unit: 'feet'
      },
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

  useEffect(() => {
    if (!isNewProject) {
      loadProject();
    }
  }, [id, isNewProject]);

  useEffect(() => {
    if (socket && !isNewProject) {
      socket.emit('join-project', id);
      
      socket.on('map-updated', handleRealTimeMapUpdate);
      socket.on('cost-updated', handleRealTimeCostUpdate);
      
      return () => {
        socket.off('map-updated');
        socket.off('cost-updated');
      };
    }
  }, [socket, id, isNewProject]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const projectData = await projectsAPI.getProject(id!);
      setProject(projectData);
    } catch (error) {
      showNotification('Failed to load project', 'error');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleRealTimeMapUpdate = (data: any) => {
    if (data.projectId === id) {
      setProject(prev => ({
        ...prev,
        mapData: data.mapData
      }));
      showNotification('Map updated by another user', 'info');
    }
  };

  const handleRealTimeCostUpdate = (data: any) => {
    if (data.projectId === id) {
      setProject(prev => ({
        ...prev,
        costEstimation: data.costEstimation
      }));
      showNotification('Cost estimation updated', 'info');
    }
  };

  const handleBasicInfoChange = (field: string, value: any) => {
    setProject(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePropertyDetailsChange = (field: string, value: any) => {
    setProject(prev => ({
      ...prev,
      propertyDetails: {
        ...prev.propertyDetails!,
        [field]: value
      }
    }));
  };

  const handleLocationChange = (field: string, value: any) => {
    setProject(prev => ({
      ...prev,
      propertyDetails: {
        ...prev.propertyDetails!,
        location: {
          ...prev.propertyDetails!.location!,
          [field]: value
        }
      }
    }));
  };

  const handleDimensionsChange = (field: string, value: any) => {
    setProject(prev => ({
      ...prev,
      propertyDetails: {
        ...prev.propertyDetails!,
        dimensions: {
          ...prev.propertyDetails!.dimensions,
          [field]: value
        }
      }
    }));
  };

  const handleAddMaterial = () => {
    if (newMaterial.type && newMaterial.quantity > 0) {
      setProject(prev => ({
        ...prev,
        propertyDetails: {
          ...prev.propertyDetails!,
          materials: [
            ...prev.propertyDetails!.materials,
            { ...newMaterial }
          ]
        }
      }));
      setNewMaterial({ type: '', quantity: 0, unit: '', pricePerUnit: 0 });
    }
  };

  const handleRemoveMaterial = (index: number) => {
    setProject(prev => ({
      ...prev,
      propertyDetails: {
        ...prev.propertyDetails!,
        materials: prev.propertyDetails!.materials.filter((_, i) => i !== index)
      }
    }));
  };

  const handleMapLayerAdd = (layer: any) => {
    setProject(prev => ({
      ...prev,
      mapData: {
        ...prev.mapData!,
        layers: [...prev.mapData!.layers, layer]
      }
    }));
  };

  const handleMapLayerDelete = (layerId: string) => {
    setProject(prev => ({
      ...prev,
      mapData: {
        ...prev.mapData!,
        layers: prev.mapData!.layers.filter(l => l.id !== layerId)
      }
    }));
  };

  const handleMapUpdate = (center: [number, number], zoom: number) => {
    setProject(prev => ({
      ...prev,
      mapData: {
        ...prev.mapData!,
        center: { lat: center[0], lng: center[1] },
        zoom
      }
    }));
  };

  const handleCalculateCost = async () => {
    if (!project._id) {
      showNotification('Please save the project first', 'warning');
      return;
    }

    try {
      setCalculating(true);
      const costEstimation = await costAPI.calculateCost(project._id);
      setProject(prev => ({
        ...prev,
        costEstimation
      }));
      showNotification('Cost estimation calculated successfully', 'success');
    } catch (error) {
      showNotification('Failed to calculate cost', 'error');
    } finally {
      setCalculating(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      if (isNewProject) {
        const savedProject = await projectsAPI.createProject(project);
        setProject(savedProject);
        showNotification('Project created successfully', 'success');
        navigate(`/project/${savedProject._id}/edit`);
      } else {
        const updatedProject = await projectsAPI.updateProject(project._id!, project);
        setProject(updatedProject);
        showNotification('Project saved successfully', 'success');
      }
    } catch (error) {
      showNotification('Failed to save project', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  const calculateSquareFootage = () => {
    const { length, width } = project.propertyDetails?.dimensions || {};
    if (length && width) {
      return (length * width).toFixed(0);
    }
    return '0';
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            {isNewProject ? 'Create New Project' : 'Edit Project'}
          </Typography>
          <Box>
            <Button
              variant="outlined"
              sx={{ mr: 2 }}
              onClick={() => navigate(`/project/${project._id}`)}
              disabled={isNewProject}
            >
              View Project
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Project'}
            </Button>
          </Box>
        </Box>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          {/* Basic Information */}
          <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Project Name"
                    value={project.name || ''}
                    onChange={(e) => handleBasicInfoChange('name', e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    rows={3}
                    value={project.description || ''}
                    onChange={(e) => handleBasicInfoChange('description', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Property Type</InputLabel>
                    <Select
                      value={project.propertyDetails?.type || 'residential'}
                      onChange={(e) => handlePropertyDetailsChange('type', e.target.value)}
                    >
                      <MenuItem value="residential">Residential</MenuItem>
                      <MenuItem value="commercial">Commercial</MenuItem>
                      <MenuItem value="industrial">Industrial</MenuItem>
                      <MenuItem value="mixed-use">Mixed Use</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={project.status || 'draft'}
                      onChange={(e) => handleBasicInfoChange('status', e.target.value)}
                    >
                      <MenuItem value="draft">Draft</MenuItem>
                      <MenuItem value="in-progress">In Progress</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Location */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Location
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    value={project.propertyDetails?.location?.address || ''}
                    onChange={(e) => handleLocationChange('address', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="City"
                    value={project.propertyDetails?.location?.city || ''}
                    onChange={(e) => handleLocationChange('city', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="State"
                    value={project.propertyDetails?.location?.state || ''}
                    onChange={(e) => handleLocationChange('state', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Zip Code"
                    value={project.propertyDetails?.location?.zipCode || ''}
                    onChange={(e) => handleLocationChange('zipCode', e.target.value)}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Dimensions */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Property Dimensions
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Length"
                    type="number"
                    value={project.propertyDetails?.dimensions?.length || ''}
                    onChange={(e) => handleDimensionsChange('length', parseFloat(e.target.value) || 0)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Width"
                    type="number"
                    value={project.propertyDetails?.dimensions?.width || ''}
                    onChange={(e) => handleDimensionsChange('width', parseFloat(e.target.value) || 0)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Height"
                    type="number"
                    value={project.propertyDetails?.dimensions?.height || ''}
                    onChange={(e) => handleDimensionsChange('height', parseFloat(e.target.value) || 0)}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth>
                    <InputLabel>Unit</InputLabel>
                    <Select
                      value={project.propertyDetails?.dimensions?.unit || 'feet'}
                      onChange={(e) => handleDimensionsChange('unit', e.target.value)}
                    >
                      <MenuItem value="feet">Feet</MenuItem>
                      <MenuItem value="meters">Meters</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Alert severity="info">
                    Square footage: {calculateSquareFootage()} {project.propertyDetails?.dimensions?.unit || 'feet'}²
                  </Alert>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Cost Estimation */}
          {project.costEstimation && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Cost Estimation
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={calculating ? <CircularProgress size={16} /> : <CalculateIcon />}
                    onClick={handleCalculateCost}
                    disabled={calculating}
                  >
                    Recalculate
                  </Button>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="body2" color="textSecondary">Materials</Typography>
                      <Typography variant="h6">${project.costEstimation.materials.toLocaleString()}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="body2" color="textSecondary">Labor</Typography>
                      <Typography variant="h6">${project.costEstimation.labor.toLocaleString()}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="body2" color="textSecondary">Permits</Typography>
                      <Typography variant="h6">${project.costEstimation.permits.toLocaleString()}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Box textAlign="center">
                      <Typography variant="body2" color="textSecondary">Equipment</Typography>
                      <Typography variant="h6">${project.costEstimation.equipment.toLocaleString()}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Box textAlign="center">
                      <Typography variant="body2" color="textSecondary">Total Estimated Cost</Typography>
                      <Typography variant="h4" color="primary">
                        ${project.costEstimation.total.toLocaleString()}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          )}

          {/* Materials */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Materials List
              </Typography>
              
              {/* Add Material Form */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    label="Material Type"
                    value={newMaterial.type}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, type: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    fullWidth
                    label="Quantity"
                    type="number"
                    value={newMaterial.quantity}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    fullWidth
                    label="Unit"
                    value={newMaterial.unit}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, unit: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <TextField
                    fullWidth
                    label="Price/Unit"
                    type="number"
                    value={newMaterial.pricePerUnit}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, pricePerUnit: parseFloat(e.target.value) || 0 }))}
                  />
                </Grid>
                <Grid item xs={12} sm={1}>
                  <IconButton
                    color="primary"
                    onClick={handleAddMaterial}
                    disabled={!newMaterial.type || newMaterial.quantity <= 0}
                  >
                    <AddIcon />
                  </IconButton>
                </Grid>
              </Grid>

              {/* Materials Table */}
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Material</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Unit</TableCell>
                      <TableCell>Price/Unit</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {project.propertyDetails?.materials?.map((material, index) => (
                      <TableRow key={index}>
                        <TableCell>{material.type}</TableCell>
                        <TableCell>{material.quantity}</TableCell>
                        <TableCell>{material.unit}</TableCell>
                        <TableCell>${material.pricePerUnit?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>
                          ${((material.pricePerUnit || 0) * material.quantity).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleRemoveMaterial(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!project.propertyDetails?.materials || project.propertyDetails.materials.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          No materials added yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Interactive Map */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Interactive Map & Floorplan
              </Typography>
              <Box sx={{ height: 500, border: '1px solid #ddd', borderRadius: 1 }}>
                <InteractiveMap
                  center={[project.mapData?.center?.lat || 40.7128, project.mapData?.center?.lng || -74.0060]}
                  zoom={project.mapData?.zoom || 13}
                  layers={project.mapData?.layers || []}
                  onLayerAdd={handleMapLayerAdd}
                  onLayerDelete={handleMapLayerDelete}
                  onMapUpdate={handleMapUpdate}
                  editable={true}
                />
              </Box>
              <Alert severity="info" sx={{ mt: 2 }}>
                Use the drawing tools to add markers, shapes, and annotations to your property map. 
                Right-click on elements to delete them.
              </Alert>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default ProjectEditor;