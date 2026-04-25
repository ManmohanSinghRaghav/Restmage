import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Card, CardContent, CardActions,
  TextField, InputAdornment, Fab, CircularProgress, Chip, Tooltip, Skeleton
} from '@mui/material';
import {
  Search, Add as AddIcon, Visibility, Edit, Delete,
  Home, Business, Factory, MergeType, TrendingUp
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { Project } from '../../types';
import { projectsAPI } from '../../services/api';
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
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const theme = useTheme();

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const response = await projectsAPI.getProjects({ search: searchQuery || undefined });
      setProjects(response.projects);
    } catch {
      showNotification('Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, showNotification]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

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

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h3" sx={{ fontWeight: 800, mb: 0.5 }}>
          My Workspace
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your real estate projects and visualizations
        </Typography>
      </Box>

      {/* Stats Bar */}
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

      {/* Search */}
      <Box sx={{ mb: 3 }}>
        <TextField
          placeholder="Search projects..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchProjects()}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search /></InputAdornment>
          }}
          sx={{ maxWidth: 420 }}
        />
      </Box>

      {/* Project Grid */}
      {loading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 3 }}>
          {[1,2,3].map(i => <Skeleton key={i} variant="rectangular" height={220} sx={{ borderRadius: 2 }} />)}
        </Box>
      ) : projects.length === 0 ? (
        <Box sx={{
          textAlign: 'center', py: 12, borderRadius: 3,
          border: `2px dashed ${theme.palette.divider}`,
          bgcolor: 'background.paper'
        }}>
          <TrendingUp sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>No projects yet</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>Create your first real estate project to get started.</Typography>
          <Button variant="contained" startIcon={<AddIcon />} size="large" onClick={() => navigate('/project/new')}>
            Create First Project
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 3 }}>
          {projects.map(project => (
            <Card key={project._id} sx={{
              display: 'flex', flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': { transform: 'translateY(-4px)', boxShadow: theme.shadows[8] }
            }}>
              {/* Color accent bar */}
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
                <Button size="small" variant="outlined" startIcon={<Visibility />} onClick={() => navigate(`/project/${project._id}`)}>
                  View
                </Button>
                <Button size="small" variant="contained" startIcon={<Edit />} onClick={() => navigate(`/project/${project._id}/edit`)}>
                  Edit
                </Button>
                <Tooltip title="Delete Project">
                  <Button
                    size="small"
                    color="error"
                    startIcon={deletingId === project._id ? <CircularProgress size={14} /> : <Delete />}
                    onClick={() => handleDelete(project._id)}
                    disabled={deletingId === project._id}
                    sx={{ ml: 'auto' }}
                  >
                    Delete
                  </Button>
                </Tooltip>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      <Fab
        color="primary" aria-label="add"
        sx={{ position: 'fixed', bottom: 32, right: 32, width: 64, height: 64 }}
        onClick={() => navigate('/project/new')}
      >
        <AddIcon fontSize="large" />
      </Fab>
    </Box>
  );
};

export default Dashboard;