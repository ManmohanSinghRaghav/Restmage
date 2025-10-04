import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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

const SimpleProjectEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  
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

  const loadProject = useCallback(async () => {
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
  }, [id, showNotification, navigate]);

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

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">
            {isNewProject ? 'Create New Project' : 'Edit Project'}
          </Typography>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Project'}
          </Button>
        </Box>

        {/* Basic Information */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Basic Information
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Project Name"
              value={project.name || ''}
              onChange={(e) => setProject(prev => ({ ...prev, name: e.target.value }))}
              required
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={project.description || ''}
              onChange={(e) => setProject(prev => ({ ...prev, description: e.target.value }))}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Property Type</InputLabel>
                <Select
                  value={project.propertyDetails?.type || 'residential'}
                  onChange={(e) => setProject(prev => ({
                    ...prev,
                    propertyDetails: {
                      ...prev.propertyDetails!,
                      type: e.target.value as any
                    }
                  }))}
                >
                  <MenuItem value="residential">Residential</MenuItem>
                  <MenuItem value="commercial">Commercial</MenuItem>
                  <MenuItem value="industrial">Industrial</MenuItem>
                  <MenuItem value="mixed-use">Mixed Use</MenuItem>
                </Select>
              </FormControl>
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={project.status || 'draft'}
                  onChange={(e) => setProject(prev => ({ ...prev, status: e.target.value as any }))}
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="in-progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Paper>

        {/* Dimensions */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Property Dimensions
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'end' }}>
            <TextField
              label="Length"
              type="number"
              value={project.propertyDetails?.dimensions?.length || ''}
              onChange={(e) => setProject(prev => ({
                ...prev,
                propertyDetails: {
                  ...prev.propertyDetails!,
                  dimensions: {
                    ...prev.propertyDetails!.dimensions,
                    length: parseFloat(e.target.value) || 0
                  }
                }
              }))}
              required
            />
            <TextField
              label="Width"
              type="number"
              value={project.propertyDetails?.dimensions?.width || ''}
              onChange={(e) => setProject(prev => ({
                ...prev,
                propertyDetails: {
                  ...prev.propertyDetails!,
                  dimensions: {
                    ...prev.propertyDetails!.dimensions,
                    width: parseFloat(e.target.value) || 0
                  }
                }
              }))}
              required
            />
            <TextField
              label="Height"
              type="number"
              value={project.propertyDetails?.dimensions?.height || ''}
              onChange={(e) => setProject(prev => ({
                ...prev,
                propertyDetails: {
                  ...prev.propertyDetails!,
                  dimensions: {
                    ...prev.propertyDetails!.dimensions,
                    height: parseFloat(e.target.value) || 0
                  }
                }
              }))}
              required
            />
            <FormControl sx={{ minWidth: 100 }}>
              <InputLabel>Unit</InputLabel>
              <Select
                value={project.propertyDetails?.dimensions?.unit || 'feet'}
                onChange={(e) => setProject(prev => ({
                  ...prev,
                  propertyDetails: {
                    ...prev.propertyDetails!,
                    dimensions: {
                      ...prev.propertyDetails!.dimensions,
                      unit: e.target.value as any
                    }
                  }
                }))}
              >
                <MenuItem value="feet">Feet</MenuItem>
                <MenuItem value="meters">Meters</MenuItem>
              </Select>
            </FormControl>
          </Box>
          {project.propertyDetails?.dimensions?.length && project.propertyDetails?.dimensions?.width && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Square footage: {(project.propertyDetails.dimensions.length * project.propertyDetails.dimensions.width).toFixed(0)} {project.propertyDetails.dimensions.unit}²
            </Alert>
          )}
        </Paper>

        {/* Cost Estimation */}
        {project.costEstimation && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Cost Estimation</Typography>
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
            <Box sx={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
              <Box>
                <Typography variant="body2" color="textSecondary">Materials</Typography>
                <Typography variant="h6">${project.costEstimation.materials.toLocaleString()}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">Labor</Typography>
                <Typography variant="h6">${project.costEstimation.labor.toLocaleString()}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">Total</Typography>
                <Typography variant="h4" color="primary">
                  ${project.costEstimation.total.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Paper>
        )}

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

        {/* Interactive Map */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Interactive Map</Typography>
          <Box sx={{ height: 500, border: '1px solid #ddd', borderRadius: 1 }}>
            <InteractiveMap
              center={[project.mapData?.center?.lat || 40.7128, project.mapData?.center?.lng || -74.0060]}
              zoom={project.mapData?.zoom || 13}
              layers={project.mapData?.layers || []}
              onLayerAdd={(layer) => setProject(prev => ({
                ...prev,
                mapData: {
                  ...prev.mapData!,
                  layers: [...prev.mapData!.layers, layer]
                }
              }))}
              onLayerDelete={(layerId) => setProject(prev => ({
                ...prev,
                mapData: {
                  ...prev.mapData!,
                  layers: prev.mapData!.layers.filter(l => l.id !== layerId)
                }
              }))}
              onMapUpdate={(center, zoom) => setProject(prev => ({
                ...prev,
                mapData: {
                  ...prev.mapData!,
                  center: { lat: center[0], lng: center[1] },
                  zoom
                }
              }))}
              editable={true}
            />
          </Box>
          <Alert severity="info" sx={{ mt: 2 }}>
            Use the drawing tools to add markers and shapes to your property map.
          </Alert>
        </Paper>
      </Box>
    </Container>
  );
};

export default SimpleProjectEditor;