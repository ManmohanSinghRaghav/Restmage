import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Grid,
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

const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getProjects({
        search: search || undefined,
      });
      setProjects(response.projects);
    } catch (error: any) {
      showNotification('Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    loadProjects();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4caf50';
      case 'in-progress':
        return '#ff9800';
      case 'draft':
        return '#9e9e9e';
      default:
        return '#9e9e9e';
    }
  };

  const handleCreateProject = () => {
    navigate('/project/new');
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          My Projects
        </Typography>
        <Typography variant="body1" color="textSecondary" gutterBottom>
          Manage your real estate projects and visualizations
        </Typography>
      </Box>

      <Box sx={{ mb: 3 }}>
        <form onSubmit={handleSearchSubmit}>
          <TextField
            fullWidth
            placeholder="Search projects..."
            value={search}
            onChange={handleSearch}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: 400 }}
          />
        </form>
      </Box>

      {projects.length === 0 ? (
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
            onClick={handleCreateProject}
            sx={{ mt: 2 }}
          >
            Create Project
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {projects.map((project) => (
            <Grid item xs={12} sm={6} md={4} key={project._id}>
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
                  <Button
                    size="small"
                    startIcon={<Visibility />}
                    onClick={() => navigate(`/project/${project._id}`)}
                  >
                    View
                  </Button>
                  <Button
                    size="small"
                    startIcon={<Edit />}
                    onClick={() => navigate(`/project/${project._id}/edit`)}
                  >
                    Edit
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
        onClick={handleCreateProject}
      >
        <AddIcon />
      </Fab>
    </Container>
  );
};

export default Dashboard;