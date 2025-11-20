import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Chip,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Calculate as CalculateIcon,
} from '@mui/icons-material';
import MapEditor from '../MapEditor/MapEditor';
import { Project } from '../../types';
import { projectsAPI, costAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const SimpleProjectView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);

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
    if (id) {
      loadProject();
    }
  }, [id, loadProject]);

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
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/project/${project._id}/edit`)}
          >
            Edit Project
          </Button>
        </Box>

        {/* Project Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Project Overview</Typography>
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
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Property Details</Typography>
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
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Cost Estimation</Typography>
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Materials:</Typography>
                  <Typography variant="body2">${project.costEstimation.materials.toLocaleString()}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Labor:</Typography>
                  <Typography variant="body2">${project.costEstimation.labor.toLocaleString()}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
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
        </div>

        {/* Materials */}
        {project.propertyDetails.materials.length > 0 && (
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Materials ({project.propertyDetails.materials.length})
            </Typography>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {project.propertyDetails.materials.map((material, index) => (
                <Box key={index} sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                  <Typography variant="subtitle2">{material.type}</Typography>
                  <Typography variant="body2">
                    {material.quantity} {material.unit}
                  </Typography>
                  <Typography variant="body2" color="primary">
                    ${((material.pricePerUnit || 0) * material.quantity).toFixed(2)}
                  </Typography>
                </Box>
              ))}
            </div>
          </Paper>
        )}

        {/* Floor Plan Viewer */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Floor Plan</Typography>
          <Box sx={{ height: 600, border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden' }}>
            <MapEditor />
          </Box>
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
            Floor plan editor
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default SimpleProjectView;