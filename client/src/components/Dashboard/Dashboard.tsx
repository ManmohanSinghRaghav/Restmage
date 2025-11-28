import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Box,
  TextField,
  InputAdornment,
  Fab,
  CircularProgress,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import { 
  Search, 
  Add as AddIcon, 
  Visibility, 
  Edit,
  CheckCircle as ActiveIcon,
} from '@mui/icons-material';
import { Project, CostEstimate } from '../../types';
import { FloorPlan } from '../../types/floorPlan.types';
import { projectsAPI, floorPlansAPI, costEstimatesAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const STATUS_COLORS = {
  completed: '#4caf50',
  'in-progress': '#ff9800',
  draft: '#9e9e9e',
};

const DEFAULT_STATUS_COLOR = '#9e9e9e';
const MAX_SEARCH_WIDTH = 400;
const LOADING_MIN_HEIGHT = '400px';

const Dashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>([]);
  const [costEstimates, setCostEstimates] = useState<CostEstimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (tabValue === 0) {
        // Projects tab
        const response = await projectsAPI.getProjects({
          search: searchQuery || undefined,
        });
        setProjects(response.projects);
      } else if (tabValue === 1) {
        // Floor Plans tab
        const plans = await floorPlansAPI.list();
        setFloorPlans(plans);
      } else if (tabValue === 2) {
        // Cost Estimates tab
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

  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSearchFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    fetchData();
  };

  const formatDateString = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getProjectStatusColor = (status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || DEFAULT_STATUS_COLOR;
  };

  const navigateToNewProject = () => {
    navigate('/project/new/edit');
  };

  const navigateToProject = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  const navigateToEditProject = (projectId: string) => {
    navigate(`/project/${projectId}/edit`);
  };

  const navigateToFloorPlanEditor = (floorPlanId: string) => {
    navigate(`/floorplans/${floorPlanId}/edit`);
  };

  const getCreateButtonConfig = () => {
    switch (tabValue) {
      case 0:
        return { label: 'New Project', onClick: navigateToNewProject };
      case 1:
        return { label: 'Generate Floor Plan', onClick: () => navigate('/floorplan') };
      case 2:
        return { label: 'Calculate Cost', onClick: () => navigate('/price-prediction') };
      default:
        return { label: 'New Project', onClick: navigateToNewProject };
    }
  };

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={LOADING_MIN_HEIGHT}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  const createButton = getCreateButtonConfig();

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="body1" color="textSecondary" gutterBottom>
          Manage your projects, floor plans, and cost estimates
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Projects" />
          <Tab label="Floor Plans" />
          <Tab label="Cost Estimates" />
        </Tabs>
      </Box>

      {tabValue === 0 && (
        <Box sx={{ mb: 3 }}>
          <form onSubmit={handleSearchFormSubmit}>
            <TextField
              fullWidth
              placeholder="Search projects..."
              value={searchQuery}
              onChange={handleSearchInputChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ maxWidth: MAX_SEARCH_WIDTH }}
            />
          </form>
        </Box>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : (
        <>
          {tabValue === 0 && (
            projects.length === 0 ? (
              <EmptyView message="No projects yet" onCreate={navigateToNewProject} />
            ) : (
              <ProjectsGrid 
                projects={projects}
                onViewProject={navigateToProject}
                onEditProject={navigateToEditProject}
                formatDate={formatDateString}
                getStatusColor={getProjectStatusColor}
              />
            )
          )}

          {tabValue === 1 && (
            floorPlans.length === 0 ? (
              <EmptyView message="No floor plans yet" onCreate={() => navigate('/floorplan')} />
            ) : (
              <FloorPlansGrid 
                floorPlans={floorPlans}
                onView={navigateToFloorPlanEditor}
                formatDate={formatDateString}
              />
            )
          )}

          {tabValue === 2 && (
            costEstimates.length === 0 ? (
              <EmptyView message="No cost estimates yet" onCreate={() => navigate('/price-prediction')} />
            ) : (
              <CostEstimatesGrid 
                costEstimates={costEstimates}
                formatDate={formatDateString}
                formatCurrency={formatCurrency}
              />
            )
          )}
        </>
      )}

      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
        onClick={createButton.onClick}
      >
        <AddIcon />
      </Fab>
    </Container>
  );
};

const EmptyView: React.FC<{ message: string; onCreate: () => void }> = ({ message, onCreate }) => (
  <Box
    sx={{
      textAlign: 'center',
      py: 8,
      px: 2,
      backgroundColor: 'background.paper',
      borderRadius: 1,
      border: '1px dashed',
      borderColor: 'grey.300',
    }}
  >
    <Typography variant="h6" gutterBottom>
      {message}
    </Typography>
    <Typography variant="body2" color="textSecondary" gutterBottom>
      Click the button below to get started
    </Typography>
    <Button
      variant="contained"
      startIcon={<AddIcon />}
      onClick={onCreate}
      sx={{ mt: 2 }}
    >
      Create
    </Button>
  </Box>
);

interface FloorPlansGridProps {
  floorPlans: FloorPlan[];
  onView: (id: string) => void;
  formatDate: (date: string) => string;
}

const FloorPlansGrid: React.FC<FloorPlansGridProps> = ({ floorPlans, onView, formatDate }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
    {floorPlans.map((plan) => (
      <Card key={plan._id}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
            <Typography variant="h6" gutterBottom noWrap>
              {plan.name || `Floor Plan v${plan.version}`}
            </Typography>
            {plan.isActive && (
              <Chip
                label="Active"
                size="small"
                color="success"
                icon={<ActiveIcon />}
              />
            )}
          </Box>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Version {plan.version}
          </Typography>
          <Box sx={{ mt: 2, mb: 1 }}>
            <Chip
              label={plan.generatedBy === 'ai' ? 'AI Generated' : 'Manual'}
              size="small"
              variant="outlined"
            />
          </Box>
          <Typography variant="caption" color="textSecondary">
            Created: {formatDate(plan.createdAt)}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {((plan as any).plot_summary || (plan as any).plotSummary)?.plot_width_ft || 0}×{((plan as any).plot_summary || (plan as any).plotSummary)?.plot_length_ft || 0} ft
          </Typography>
        </CardContent>
        <CardActions>
          <Button size="small" startIcon={<Visibility />} onClick={() => onView(plan._id)}>
            View
          </Button>
        </CardActions>
      </Card>
    ))}
  </Box>
);

interface CostEstimatesGridProps {
  costEstimates: CostEstimate[];
  formatDate: (date: string) => string;
  formatCurrency: (amount: number, currency: string) => string;
}

const CostEstimatesGrid: React.FC<CostEstimatesGridProps> = ({ costEstimates, formatDate, formatCurrency }) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
    {costEstimates.map((estimate) => (
      <Card key={estimate._id}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
            <Typography variant="h6" gutterBottom noWrap>
              {estimate.name || `Cost Estimate v${estimate.version}`}
            </Typography>
            {estimate.isActive && (
              <Chip
                label="Active"
                size="small"
                color="success"
                icon={<ActiveIcon />}
              />
            )}
          </Box>
          <Typography variant="h5" color="primary" gutterBottom>
            {formatCurrency(estimate.total, estimate.currency)}
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Version {estimate.version}
          </Typography>
          <Box sx={{ mt: 2, mb: 1 }}>
            <Chip
              label={estimate.calculationMethod.toUpperCase()}
              size="small"
              variant="outlined"
            />
          </Box>
          <Typography variant="caption" color="textSecondary">
            Calculated: {formatDate(estimate.calculatedAt)}
          </Typography>
        </CardContent>
      </Card>
    ))}
  </Box>
);

interface ProjectsGridProps {
  projects: Project[];
  onViewProject: (id: string) => void;
  onEditProject: (id: string) => void;
  formatDate: (date: string) => string;
  getStatusColor: (status: string) => string;
}

const ProjectsGrid: React.FC<ProjectsGridProps> = ({
  projects,
  onViewProject,
  onEditProject,
  formatDate,
  getStatusColor,
}) => (
  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
    {projects.map((project) => (
      <ProjectCard
        key={project._id}
        project={project}
        onView={() => onViewProject(project._id)}
        onEdit={() => onEditProject(project._id)}
        formatDate={formatDate}
        getStatusColor={getStatusColor}
      />
    ))}
  </Box>
);

interface ProjectCardProps {
  project: Project;
  onView: () => void;
  onEdit: () => void;
  formatDate: (date: string) => string;
  getStatusColor: (status: string) => string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onView,
  onEdit,
  formatDate,
  getStatusColor,
}) => (
  <Card>
    <CardContent>
      <Typography variant="h6" gutterBottom noWrap>
        {project.name}
      </Typography>
      <Typography variant="body2" color="textSecondary" gutterBottom>
        {project.description || 'No description'}
      </Typography>
      <Box sx={{ mt: 2, mb: 1 }}>
        <Box
          sx={{
            display: 'inline-block',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            backgroundColor: getStatusColor(project.status) + '20',
            color: getStatusColor(project.status),
            fontSize: '0.75rem',
            textTransform: 'capitalize',
          }}
        >
          {project.status}
        </Box>
      </Box>
      <Typography variant="caption" color="textSecondary">
        Updated: {formatDate(project.updatedAt)}
      </Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        {project.propertyDetails.type} • {project.propertyDetails.dimensions.length}×{project.propertyDetails.dimensions.width} {project.propertyDetails.dimensions.unit}
      </Typography>
      {project.costEstimation && (
        <Typography variant="body2" color="primary" sx={{ mt: 1, fontWeight: 'medium' }}>
          Est. Cost: ${project.costEstimation.total.toLocaleString()}
        </Typography>
      )}
    </CardContent>
    <CardActions>
      <Button size="small" startIcon={<Visibility />} onClick={onView}>
        View
      </Button>
      <Button size="small" startIcon={<Edit />} onClick={onEdit}>
        Edit
      </Button>
    </CardActions>
  </Card>
);

export default Dashboard;