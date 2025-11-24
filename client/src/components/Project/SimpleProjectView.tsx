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
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Edit as EditIcon,
  Calculate as CalculateIcon,
  CheckCircle as ActiveIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { Project, CostEstimate } from '../../types';
import { FloorPlan } from '../../types/floorPlan.types';
import { projectsAPI, floorPlansAPI, costEstimatesAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const SimpleProjectView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [project, setProject] = useState<Project | null>(null);
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [costEstimates, setCostEstimates] = useState<CostEstimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFloorPlans, setLoadingFloorPlans] = useState(false);
  const [loadingCostEstimates, setLoadingCostEstimates] = useState(false);

  const loadFloorPlans = useCallback(async () => {
    try {
      setLoadingFloorPlans(true);
      const plans = await floorPlansAPI.list(id!);
      setFloorPlans(plans);
    } catch (error) {
      console.error('Failed to load floor plans:', error);
    } finally {
      setLoadingFloorPlans(false);
    }
  }, [id]);

  const loadCostEstimates = useCallback(async () => {
    try {
      setLoadingCostEstimates(true);
      const estimates = await costEstimatesAPI.list(id!);
      setCostEstimates(estimates);
    } catch (error) {
      console.error('Failed to load cost estimates:', error);
    } finally {
      setLoadingCostEstimates(false);
    }
  }, [id]);

  const loadProject = useCallback(async () => {
    try {
      setLoading(true);
      const projectData = await projectsAPI.getProject(id!);
      setProject(projectData);
      
      // Load floor plans and cost estimates
      loadFloorPlans();
      loadCostEstimates();
    } catch (error) {
      showNotification('Failed to load project', 'error');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, showNotification, navigate, loadFloorPlans, loadCostEstimates]);

  useEffect(() => {
    if (id) {
      loadProject();
    }
  }, [id, loadProject]);

  const handleActivateFloorPlan = async (floorPlanId: string) => {
    try {
      await floorPlansAPI.activate(floorPlanId);
      showNotification('Floor plan activated successfully', 'success');
      loadProject();
      loadFloorPlans();
    } catch (error) {
      showNotification('Failed to activate floor plan', 'error');
    }
  };

  const handleActivateCostEstimate = async (estimateId: string) => {
    try {
      await costEstimatesAPI.activate(estimateId);
      showNotification('Cost estimate activated successfully', 'success');
      loadProject();
      loadCostEstimates();
    } catch (error) {
      showNotification('Failed to activate cost estimate', 'error');
    }
  };

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
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
              <Typography variant="h6">Active Cost Estimate</Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => navigate(`/price-prediction/${project._id}`)}
              >
                Calculate New
              </Button>
            </Box>
            
            {project.activeCostEstimate ? (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Materials:</Typography>
                  <Typography variant="body2">{formatCurrency(project.activeCostEstimate.materials, project.activeCostEstimate.currency)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Labor:</Typography>
                  <Typography variant="body2">{formatCurrency(project.activeCostEstimate.labor, project.activeCostEstimate.currency)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Equipment:</Typography>
                  <Typography variant="body2">{formatCurrency(project.activeCostEstimate.equipment, project.activeCostEstimate.currency)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Permits:</Typography>
                  <Typography variant="body2">{formatCurrency(project.activeCostEstimate.permits, project.activeCostEstimate.currency)}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6">Total:</Typography>
                  <Typography variant="h6" color="primary">
                    {formatCurrency(project.activeCostEstimate.total, project.activeCostEstimate.currency)}
                  </Typography>
                </Box>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                  Version {project.activeCostEstimate.version} • {formatDate(project.activeCostEstimate.calculatedAt)}
                </Typography>
              </Box>
            ) : (
              <Alert severity="info">
                No cost estimate calculated yet
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

        {/* Floor Plans */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Floor Plans ({floorPlans.length})</Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => navigate(`/floorplan/${project._id}`)}
            >
              Generate New
            </Button>
          </Box>
          
          {loadingFloorPlans ? (
            <CircularProgress size={24} />
          ) : floorPlans.length > 0 ? (
            <List>
              {floorPlans.map((plan) => (
                <ListItem
                  key={plan._id}
                  sx={{
                    border: '1px solid #ddd',
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: plan.isActive ? 'action.selected' : 'background.paper',
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {plan.name || `Floor Plan v${plan.version}`}
                        {plan.isActive && (
                          <Chip
                            label="Active"
                            size="small"
                            color="success"
                            icon={<ActiveIcon />}
                          />
                        )}
                        <Chip
                          label={plan.generatedBy === 'ai' ? 'AI Generated' : 'Manual'}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={`Version ${plan.version} • Created ${formatDate(plan.createdAt)}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => navigate(`/floorplans/${plan._id}/edit`)}
                      sx={{ mr: 1 }}
                    >
                      <ViewIcon />
                    </IconButton>
                    {!plan.isActive && (
                      <Button
                        size="small"
                        onClick={() => handleActivateFloorPlan(plan._id)}
                      >
                        Activate
                      </Button>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Alert severity="info">
              No floor plans yet. Click "Generate New" to create one.
            </Alert>
          )}
        </Paper>

        {/* Cost Estimates */}
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Cost Estimates ({costEstimates.length})</Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<CalculateIcon />}
              onClick={() => navigate(`/price-prediction/${project._id}`)}
            >
              Calculate New
            </Button>
          </Box>
          
          {loadingCostEstimates ? (
            <CircularProgress size={24} />
          ) : costEstimates.length > 0 ? (
            <List>
              {costEstimates.map((estimate) => (
                <ListItem
                  key={estimate._id}
                  sx={{
                    border: '1px solid #ddd',
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: estimate.isActive ? 'action.selected' : 'background.paper',
                  }}
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {estimate.name || `Cost Estimate v${estimate.version}`}
                        {estimate.isActive && (
                          <Chip
                            label="Active"
                            size="small"
                            color="success"
                            icon={<ActiveIcon />}
                          />
                        )}
                        <Chip
                          label={formatCurrency(estimate.total, estimate.currency)}
                          size="small"
                          color="primary"
                        />
                      </Box>
                    }
                    secondary={`Version ${estimate.version} • ${estimate.calculationMethod} • ${formatDate(estimate.calculatedAt)}`}
                  />
                  <ListItemSecondaryAction>
                    {!estimate.isActive && (
                      <Button
                        size="small"
                        onClick={() => handleActivateCostEstimate(estimate._id)}
                      >
                        Activate
                      </Button>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          ) : (
            <Alert severity="info">
              No cost estimates yet. Click "Calculate New" to create one.
            </Alert>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default SimpleProjectView;