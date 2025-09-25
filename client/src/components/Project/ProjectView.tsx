import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import {
  Edit as EditIcon,
  GetApp as ExportIcon,
  Calculate as CalculateIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import InteractiveMap from '../Map/InteractiveMap';
import { Project } from '../../types';
import { projectsAPI, costAPI, exportAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';
import { useSocket } from '../../contexts/SocketContext';

const ProjectView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { socket } = useSocket();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    if (id) {
      loadProject();
    }
  }, [id]);

  useEffect(() => {
    if (socket && id) {
      socket.emit('join-project', id);
      
      socket.on('map-updated', handleRealTimeUpdate);
      socket.on('cost-updated', handleCostUpdate);
      
      return () => {
        socket.off('map-updated');
        socket.off('cost-updated');
      };
    }
  }, [socket, id]);

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

  const handleRealTimeUpdate = (data: any) => {
    if (data.projectId === id) {
      setProject(prev => prev ? { ...prev, mapData: data.mapData } : null);
      showNotification('Project updated in real-time', 'info');
    }
  };

  const handleCostUpdate = (data: any) => {
    if (data.projectId === id) {
      setProject(prev => prev ? { ...prev, costEstimation: data.costEstimation } : null);
      showNotification('Cost estimation updated', 'success');
    }
  };

  const handleCalculateCost = async () => {
    if (!project) return;

    try {
      setCalculating(true);
      const costEstimation = await costAPI.calculateCost(project._id);
      setProject(prev => prev ? { ...prev, costEstimation } : null);
      showNotification('Cost estimation updated successfully', 'success');
    } catch (error) {
      showNotification('Failed to calculate cost', 'error');
    } finally {
      setCalculating(false);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf' | 'json') => {
    if (!project) return;

    try {
      let blob: Blob;
      let filename: string;

      switch (format) {
        case 'csv':
          blob = await exportAPI.exportCSV(project._id);
          filename = `${project.name}-export.csv`;
          break;
        case 'pdf':
          blob = await exportAPI.exportPDF(project._id);
          filename = `${project.name}-report.pdf`;
          break;
        case 'json':
          blob = await exportAPI.exportJSON(project._id);
          filename = `${project.name}-data.json`;
          break;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showNotification(`Exported as ${format.toUpperCase()}`, 'success');
    } catch (error) {
      showNotification(`Failed to export as ${format.toUpperCase()}`, 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in-progress':
        return 'warning';
      case 'draft':
        return 'default';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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

  if (!project) {
    return (
      <Container>
        <Alert severity="error">Project not found</Alert>
      </Container>
    );
  }

  const calculateSquareFootage = () => {
    const { length, width } = project.propertyDetails.dimensions;
    return (length * width).toFixed(0);
  };

  const totalMaterialsCost = project.propertyDetails.materials.reduce(
    (total, material) => total + (material.quantity * (material.pricePerUnit || 0)),
    0
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 2 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {project.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip 
                label={project.status} 
                color={getStatusColor(project.status) as any}
                size="small"
              />
              <Typography variant="body2" color="textSecondary">
                Last updated: {formatDate(project.updatedAt)}
              </Typography>
            </Box>
          </Box>
          <Box>
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={() => handleExport('csv')}
              sx={{ mr: 1 }}
            >
              Export CSV
            </Button>
            <Button
              variant="outlined"
              startIcon={<ExportIcon />}
              onClick={() => handleExport('pdf')}
              sx={{ mr: 1 }}
            >
              Export PDF
            </Button>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/project/${project._id}/edit`)}
            >
              Edit Project
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Project Overview */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: 'fit-content' }}>
              <Typography variant="h6" gutterBottom>
                Project Overview
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">Description</Typography>
                <Typography variant="body1">
                  {project.description || 'No description provided'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">Property Type</Typography>
                <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                  {project.propertyDetails.type}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">Owner</Typography>
                <Typography variant="body1">
                  {project.owner.username}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">Created</Typography>
                <Typography variant="body1">
                  {formatDate(project.createdAt)}
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Property Details */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: 'fit-content' }}>
              <Typography variant="h6" gutterBottom>
                Property Details
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">Dimensions</Typography>
                <Typography variant="body1">
                  {project.propertyDetails.dimensions.length} × {project.propertyDetails.dimensions.width} × {project.propertyDetails.dimensions.height} {project.propertyDetails.dimensions.unit}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="textSecondary">Square Footage</Typography>
                <Typography variant="body1">
                  {calculateSquareFootage()} {project.propertyDetails.dimensions.unit}²
                </Typography>
              </Box>
              {project.propertyDetails.location?.address && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    <LocationIcon sx={{ verticalAlign: 'middle', mr: 0.5, fontSize: 16 }} />
                    Location
                  </Typography>
                  <Typography variant="body1">
                    {project.propertyDetails.location.address}
                    {project.propertyDetails.location.city && `, ${project.propertyDetails.location.city}`}
                    {project.propertyDetails.location.state && `, ${project.propertyDetails.location.state}`}
                    {project.propertyDetails.location.zipCode && ` ${project.propertyDetails.location.zipCode}`}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Cost Summary */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, height: 'fit-content' }}>
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
                  {calculating ? 'Calculating...' : 'Calculate'}
                </Button>
              </Box>
              
              {project.costEstimation ? (
                <Box>
                  <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Materials:</Typography>
                    <Typography variant="body2">${project.costEstimation.materials.toLocaleString()}</Typography>
                  </Box>
                  <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Labor:</Typography>
                    <Typography variant="body2">${project.costEstimation.labor.toLocaleString()}</Typography>
                  </Box>
                  <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Permits:</Typography>
                    <Typography variant="body2">${project.costEstimation.permits.toLocaleString()}</Typography>
                  </Box>
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Equipment:</Typography>
                    <Typography variant="body2">${project.costEstimation.equipment.toLocaleString()}</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6">Total:</Typography>
                    <Typography variant="h6" color="primary">
                      ${project.costEstimation.total.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Alert severity="info">
                  Click "Calculate" to generate cost estimation
                </Alert>
              )}
            </Paper>
          </Grid>

          {/* Materials List */}
          {project.propertyDetails.materials.length > 0 && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Materials ({project.propertyDetails.materials.length})
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Material</TableCell>
                        <TableCell>Quantity</TableCell>
                        <TableCell>Unit Price</TableCell>
                        <TableCell>Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {project.propertyDetails.materials.map((material, index) => (
                        <TableRow key={index}>
                          <TableCell>{material.type}</TableCell>
                          <TableCell>{material.quantity} {material.unit}</TableCell>
                          <TableCell>${(material.pricePerUnit || 0).toFixed(2)}</TableCell>
                          <TableCell>
                            ${((material.pricePerUnit || 0) * material.quantity).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3}><strong>Total Materials Cost</strong></TableCell>
                        <TableCell><strong>${totalMaterialsCost.toFixed(2)}</strong></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          )}

          {/* Collaborators */}
          {project.collaborators.length > 0 && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Collaborators
                </Typography>
                {project.collaborators.map((collab, index) => (
                  <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">{collab.user.username}</Typography>
                    <Chip label={collab.role} size="small" variant="outlined" />
                  </Box>
                ))}
              </Paper>
            </Grid>
          )}

          {/* Interactive Map */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Property Map & Layout
              </Typography>
              <Box sx={{ height: 500, border: '1px solid #ddd', borderRadius: 1 }}>
                <InteractiveMap
                  center={[project.mapData.center.lat, project.mapData.center.lng]}
                  zoom={project.mapData.zoom}
                  layers={project.mapData.layers}
                  editable={false}
                />
              </Box>
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                Map layers: {project.mapData.layers.length} | 
                Center: {project.mapData.center.lat.toFixed(4)}, {project.mapData.center.lng.toFixed(4)}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default ProjectView;