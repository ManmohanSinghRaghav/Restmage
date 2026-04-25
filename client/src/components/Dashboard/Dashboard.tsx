import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Card, CardContent, CardActions,
  TextField, InputAdornment, Fab, CircularProgress, Chip, Tooltip, Skeleton,
  Tabs, Tab, Container
} from '@mui/material';
import {
  Search, Add as AddIcon, Visibility, Edit, Delete,
  Home, Business, Factory, MergeType, TrendingUp,
  CheckCircle as ActiveIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { Project, CostEstimate } from '../../types';
import { FloorPlan } from '../../types/floorPlan.types';
import { projectsAPI, floorPlansAPI, costEstimatesAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const PROPERTY_TYPE_ICONS: Record<string, React.ReactElement> = {
  residential: <Home fontSize="small" />,
  commercial: <Business fontSize="small" />,
  industrial: <Factory fontSize="small" />,
  'mixed-use': <MergeType fontSize="small" />,
};

const STATUS_COLORS: Record<string, string> = {
  completed: '#22c55e',
  'in-progress': '#f97316',
  draft: '#94a3b8',
  archived: '#6b7280',
};

const Dashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [costEstimates, setCostEstimates] = useState<CostEstimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const theme = useTheme();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (tabValue === 0) {
        const response = await projectsAPI.getProjects({ search: searchQuery || undefined });
        setProjects(response.projects);
      } else if (tabValue === 1) {
        const plans = await floorPlansAPI.list();
        setFloorPlans(plans);
      } else if (tabValue === 2) {
        const estimates = await costEstimatesAPI.list();
        setCostEstimates(estimates);
      }
    } catch (error: any) {
      showNotification('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [tabValue, searchQuery, showNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setSearchQuery('');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this project? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await projectsAPI.deleteProject(id);
      setProjects(p => p.filter(pr => pr._id !== id));
      showNotification('Project deleted', 'success');
    } catch {
      showNotification('Failed to delete project', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDateString = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5 }}>
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your real estate projects and visualizations
        </Typography>
      </Box>

      {/* Stats Bar */}
      {tabValue === 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 2, mb: 4 }}>
          {[
            { label: 'Total Projects', value: projects.length, color: theme.palette.primary.main },
            { label: 'In Progress', value: projects.filter(p => p.status === 'in-progress').length, color: '#f97316' },
            { label: 'Completed', value: projects.filter(p => p.status === 'completed').length, color: '#22c55e' },
            { label: 'Drafts', value: projects.filter(p => p.status === 'draft').length, color: '#94a3b8' },
          ].map(stat => (
            <Card key={stat.label} sx={{ textAlign: 'center', p: 1 }}>
              <CardContent sx={{ p: '12px !important' }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: stat.color }}>{stat.value}</Typography>
                <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Projects" sx={{ fontWeight: 700 }} />
          <Tab label="Floor Plans" sx={{ fontWeight: 700 }} />
          <Tab label="Cost Estimates" sx={{ fontWeight: 700 }} />
        </Tabs>
      </Box>

      {/* Search */}
      {tabValue === 0 && (
        <Box sx={{ mb: 3 }}>
          <TextField
            placeholder="Search projects..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchData()}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search /></InputAdornment>
            }}
            sx={{ maxWidth: 420 }}
          />
        </Box>
      )}

      {/* Content Area */}
      {loading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 3 }}>
          {[1, 2, 3].map(i => <Skeleton key={i} variant="rectangular" height={220} sx={{ borderRadius: 2 }} />)}
        </Box>
      ) : (
        <>
          {tabValue === 0 && (
            projects.length === 0 ? (
              <EmptyView message="No projects yet" onCreate={() => navigate('/project/new')} />
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 3 }}>
                {projects.map(project => (
                  <ProjectCard 
                    key={project._id} 
                    project={project} 
                    onView={() => navigate(`/project/${project._id}`)}
                    onEdit={() => navigate(`/project/${project._id}/edit`)}
                    onDelete={() => handleDelete(project._id)}
                    deletingId={deletingId}
                  />
                ))}
              </Box>
            )
          )}

          {tabValue === 1 && (
            floorPlans.length === 0 ? (
              <EmptyView message="No floor plans yet" onCreate={() => navigate('/floorplan')} />
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 3 }}>
                {floorPlans.map((plan) => (
                  <FloorPlanCard key={plan._id} plan={plan} onView={() => navigate(`/floorplans/${plan._id}/edit`)} />
                ))}
              </Box>
            )
          )}

          {tabValue === 2 && (
            costEstimates.length === 0 ? (
              <EmptyView message="No cost estimates yet" onCreate={() => navigate('/price-prediction')} />
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 3 }}>
                {costEstimates.map((estimate) => (
                  <CostEstimateCard 
                    key={estimate._id} 
                    estimate={estimate} 
                    formatCurrency={formatCurrency}
                  />
                ))}
              </Box>
            )
          )}
        </>
      )}

      <Fab
        color="primary" aria-label="add"
        sx={{ position: 'fixed', bottom: 32, right: 32, width: 64, height: 64 }}
        onClick={() => {
          if (tabValue === 0) navigate('/project/new');
          else if (tabValue === 1) navigate('/floorplan');
          else navigate('/price-prediction');
        }}
      >
        <AddIcon fontSize="large" />
      </Fab>
    </Box>
  );
};

const EmptyView: React.FC<{ message: string; onCreate: () => void }> = ({ message, onCreate }) => {
  const theme = useTheme();
  return (
    <Box sx={{
      textAlign: 'center', py: 12, borderRadius: 3,
      border: `2px dashed ${theme.palette.divider}`,
      bgcolor: 'background.paper'
    }}>
      <TrendingUp sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>{message}</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>Get started by creating your first entry.</Typography>
      <Button variant="contained" startIcon={<AddIcon />} size="large" onClick={onCreate}>
        Create New
      </Button>
    </Box>
  );
};

const ProjectCard: React.FC<{ project: Project; onView: () => void; onEdit: () => void; onDelete: () => void; deletingId: string | null }> = ({ project, onView, onEdit, onDelete, deletingId }) => {
  const theme = useTheme();
  return (
    <Card sx={{
      display: 'flex', flexDirection: 'column',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': { transform: 'translateY(-4px)', boxShadow: theme.shadows[8] }
    }}>
      <Box sx={{ height: 4, bgcolor: STATUS_COLORS[project.status] || '#94a3b8', borderRadius: '8px 8px 0 0' }} />
      <CardContent sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, flex: 1, mr: 1 }} noWrap>
            {project.name}
          </Typography>
          <Chip
            size="small"
            label={project.status.replace('-', ' ')}
            sx={{
              bgcolor: STATUS_COLORS[project.status] + '20',
              color: STATUS_COLORS[project.status],
              fontWeight: 600,
              textTransform: 'capitalize',
              fontSize: '0.7rem'
            }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
          {project.description || 'No description provided.'}
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1.5 }}>
          <Chip
            icon={PROPERTY_TYPE_ICONS[project.propertyDetails.type]}
            label={project.propertyDetails.type}
            size="small"
            variant="outlined"
            sx={{ textTransform: 'capitalize', fontSize: '0.7rem' }}
          />
          <Chip
            label={`${project.propertyDetails.dimensions.length}×${project.propertyDetails.dimensions.width} ${project.propertyDetails.dimensions.unit}`}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.7rem' }}
          />
        </Box>

        {project.costEstimation?.total ? (
          <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
            Est. Cost: ${project.costEstimation.total.toLocaleString()}
          </Typography>
        ) : null}

        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1 }}>
          Updated {new Date(project.updatedAt).toLocaleDateString()}
        </Typography>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, gap: 1 }}>
        <Button size="small" variant="outlined" startIcon={<Visibility />} onClick={onView}>View</Button>
        <Button size="small" variant="contained" startIcon={<Edit />} onClick={onEdit}>Edit</Button>
        <Tooltip title="Delete Project">
          <Button
            size="small"
            color="error"
            startIcon={deletingId === project._id ? <CircularProgress size={14} /> : <Delete />}
            onClick={onDelete}
            disabled={deletingId === project._id}
            sx={{ ml: 'auto' }}
          >
            Delete
          </Button>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

const FloorPlanCard: React.FC<{ plan: FloorPlan; onView: () => void }> = ({ plan, onView }) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
        <Typography variant="h6" gutterBottom noWrap sx={{ fontWeight: 700 }}>
          {plan.name || `Floor Plan v${plan.version}`}
        </Typography>
        {plan.isActive && (
          <Chip label="Active" size="small" color="success" icon={<ActiveIcon />} />
        )}
      </Box>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        Version {plan.version} • {plan.generatedBy === 'ai' ? 'AI Generated' : 'Manual'}
      </Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        Plot: {((plan as any).plot_summary || (plan as any).plotSummary)?.plot_width_ft || 0}×{((plan as any).plot_summary || (plan as any).plotSummary)?.plot_length_ft || 0} ft
      </Typography>
    </CardContent>
    <CardActions sx={{ px: 2, pb: 2 }}>
      <Button size="small" variant="outlined" startIcon={<Visibility />} onClick={onView}>View</Button>
    </CardActions>
  </Card>
);

const CostEstimateCard: React.FC<{ estimate: CostEstimate; formatCurrency: (amount: number, currency: string) => string }> = ({ estimate, formatCurrency }) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
        <Typography variant="h6" gutterBottom noWrap sx={{ fontWeight: 700 }}>
          {estimate.name || `Cost Estimate v${estimate.version}`}
        </Typography>
        {estimate.isActive && (
          <Chip label="Active" size="small" color="success" icon={<ActiveIcon />} />
        )}
      </Box>
      <Typography variant="h5" color="primary" sx={{ fontWeight: 800 }} gutterBottom>
        {formatCurrency(estimate.total, estimate.currency)}
      </Typography>
      <Typography variant="body2" color="textSecondary">
        Method: {estimate.calculationMethod.toUpperCase()}
      </Typography>
      <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
        Calculated: {new Date(estimate.calculatedAt).toLocaleDateString()}
      </Typography>
    </CardContent>
  </Card>
);

export default Dashboard;