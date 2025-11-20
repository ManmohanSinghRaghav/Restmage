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
} from '@mui/material';
import { Search, Add as AddIcon, Visibility, Edit } from '@mui/icons-material';
import { Project } from '../../types';
import { projectsAPI } from '../../services/api';
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getProjects({
        search: searchQuery || undefined,
      });
      setProjects(response.projects);
    } catch (error: any) {
      showNotification('Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, showNotification]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSearchFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    fetchProjects();
  };

  const formatDateString = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
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

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={LOADING_MIN_HEIGHT}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          My Projects
        </Typography>
        <Typography variant="body1" color="textSecondary" gutterBottom>
          Manage your real estate projects and visualizations
        </Typography>
      </Box>

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

      {projects.length === 0 ? (
        <EmptyProjectsView onCreateProject={navigateToNewProject} />
      ) : (
        <ProjectsGrid 
          projects={projects}
          onViewProject={navigateToProject}
          onEditProject={navigateToEditProject}
          formatDate={formatDateString}
          getStatusColor={getProjectStatusColor}
        />
      )}

      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
        onClick={navigateToNewProject}
      >
        <AddIcon />
      </Fab>
    </Container>
  );
};

const EmptyProjectsView: React.FC<{ onCreateProject: () => void }> = ({ onCreateProject }) => (
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
      No projects yet
    </Typography>
    <Typography variant="body2" color="textSecondary" gutterBottom>
      Create your first real estate project to get started
    </Typography>
    <Button
      variant="contained"
      startIcon={<AddIcon />}
      onClick={onCreateProject}
      sx={{ mt: 2 }}
    >
      Create Project
    </Button>
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