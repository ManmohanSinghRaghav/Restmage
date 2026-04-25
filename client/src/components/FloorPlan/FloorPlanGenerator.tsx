import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Paper, Typography, TextField, Button,
  Select, MenuItem, FormControl, InputLabel, Alert, FormControlLabel,
  Checkbox, Autocomplete, CircularProgress
} from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';
import { floorPlansAPI, projectsAPI } from '../../services/api';
import { generateFloorPlan as generateFloorPlanAI } from '../../services/geminiFloorPlan';
import { Project } from '../../types';
import { FloorPlanInputs } from '../../types/floorPlan.types';

interface FloorPlanGeneratorProps {
  projectId?: string;
}

const FloorPlanGenerator: React.FC<FloorPlanGeneratorProps> = ({ projectId: propProjectId }) => {
  const navigate = useNavigate();
  const { projectId: urlProjectId } = useParams<{ projectId: string }>();
  const projectId = propProjectId || urlProjectId;

  // Property inputs
  const [plotWidth, setPlotWidth] = useState<number>(60);
  const [plotLength, setPlotLength] = useState<number>(40);
  const [entranceFacing, setEntranceFacing] = useState<string>('West');
  const [setbackFront, setSetbackFront] = useState<number>(3);
  const [setbackRear, setSetbackRear] = useState<number>(3);
  const [setbackSideLeft, setSetbackSideLeft] = useState<number>(3);
  const [setbackSideRight, setSetbackSideRight] = useState<number>(3);
  const [rooms, setRooms] = useState<string>('2 Bedrooms, 2 Bathrooms, 1 Living Room, 1 Kitchen');
  const [floors, setFloors] = useState<number>(1);
  const [location, setLocation] = useState<string>('Mathura, India');
  const [vastuCompliance, setVastuCompliance] = useState<boolean>(true);

  // Project selection for standalone usage
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load project if projectId provided
  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
    }
  }, [projectId]);

  // Search projects for standalone usage
  useEffect(() => {
    if (!projectId && projectSearchQuery.length > 0) {
      searchProjects(projectSearchQuery);
    }
  }, [projectSearchQuery, projectId]);

  const loadProject = async (id: string) => {
    try {
      const project = await projectsAPI.getProject(id);
      setSelectedProject(project);
      // Pre-fill inputs from project if available
      if (project.propertyDetails?.dimensions) {
        const dims = project.propertyDetails.dimensions;
        if (dims.unit === 'feet') {
          setPlotWidth(dims.width);
          setPlotLength(dims.length);
        }
      }
      if (project.propertyDetails?.location?.city) {
        setLocation(project.propertyDetails.location.city);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load project');
    }
  };

  const searchProjects = async (search: string) => {
    setProjectsLoading(true);
    try {
      const response = await projectsAPI.getProjects({ search, limit: 20 });
      setAvailableProjects(response.projects);
    } catch (err) {
      console.error('Failed to search projects:', err);
    } finally {
      setProjectsLoading(false);
    }
  };

  const generateFloorPlan = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validate that we have a project
      if (!projectId && !selectedProject) {
        setError('Please select a project or create one first');
        setLoading(false);
        return;
      }

      const targetProjectId = projectId || selectedProject!._id;

      const inputs: FloorPlanInputs = {
        plot_width_ft: plotWidth,
        plot_length_ft: plotLength,
        entrance_facing: entranceFacing,
        setback_front_ft: setbackFront,
        setback_rear_ft: setbackRear,
        setback_side_left_ft: setbackSideLeft,
        setback_side_right_ft: setbackSideRight,
        rooms,
        floors,
        location: location || undefined,
        vastu_compliance: vastuCompliance,
      };

      // Generate floor plan using the working endpoint
      const generatedPlan = await generateFloorPlanAI(inputs);
      
      // Save to database with project link
      const savedFloorPlan = await floorPlansAPI.create({
        project: targetProjectId,
        name: `AI Floor Plan - ${new Date().toLocaleDateString()}`,
        map_info: generatedPlan.map_info,
        plot_summary: generatedPlan.plot_summary,
        rooms: generatedPlan.rooms,
        walls: generatedPlan.walls,
        doors: generatedPlan.doors,
        windows: generatedPlan.windows,
        fixtures: generatedPlan.fixtures,
        generatedBy: 'ai',
        isActive: true,
      });
      
      // Navigate to editor
      navigate(`/floorplans/${savedFloorPlan._id}/edit`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate floor plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <HomeIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4">
            AI Floor Plan Generator
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Project Selection (only for standalone usage) */}
        {!projectId && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Select Project
            </Typography>
            <Autocomplete
              options={availableProjects}
              getOptionLabel={(option) => option.name}
              value={selectedProject}
              onChange={(_, newValue) => setSelectedProject(newValue)}
              onInputChange={(_, newInputValue) => setProjectSearchQuery(newInputValue)}
              loading={projectsLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search and select project"
                  placeholder="Type to search projects..."
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {projectsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Box>
        )}

        {/* Plot Dimensions */}
        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          Plot Dimensions (in feet)
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            label="Plot Width"
            type="number"
            value={plotWidth}
            onChange={(e) => setPlotWidth(Number(e.target.value))}
            inputProps={{ min: 10, max: 500 }}
            sx={{ flex: 1, minWidth: 150 }}
          />
          <TextField
            label="Plot Length"
            type="number"
            value={plotLength}
            onChange={(e) => setPlotLength(Number(e.target.value))}
            inputProps={{ min: 10, max: 500 }}
            sx={{ flex: 1, minWidth: 150 }}
          />
        </Box>

        {/* Setbacks */}
        <Typography variant="h6" gutterBottom>
          Setbacks (in feet)
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            label="Front Setback"
            type="number"
            value={setbackFront}
            onChange={(e) => setSetbackFront(Number(e.target.value))}
            inputProps={{ min: 0, max: 50 }}
            sx={{ flex: 1, minWidth: 120 }}
          />
          <TextField
            label="Rear Setback"
            type="number"
            value={setbackRear}
            onChange={(e) => setSetbackRear(Number(e.target.value))}
            inputProps={{ min: 0, max: 50 }}
            sx={{ flex: 1, minWidth: 120 }}
          />
          <TextField
            label="Left Setback"
            type="number"
            value={setbackSideLeft}
            onChange={(e) => setSetbackSideLeft(Number(e.target.value))}
            inputProps={{ min: 0, max: 50 }}
            sx={{ flex: 1, minWidth: 120 }}
          />
          <TextField
            label="Right Setback"
            type="number"
            value={setbackSideRight}
            onChange={(e) => setSetbackSideRight(Number(e.target.value))}
            inputProps={{ min: 0, max: 50 }}
            sx={{ flex: 1, minWidth: 120 }}
          />
        </Box>

        {/* Building Requirements */}
        <Typography variant="h6" gutterBottom>
          Building Requirements
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <FormControl sx={{ flex: 1, minWidth: 150 }}>
            <InputLabel>Entrance Facing</InputLabel>
            <Select
              value={entranceFacing}
              label="Entrance Facing"
              onChange={(e) => setEntranceFacing(e.target.value)}
            >
              <MenuItem value="North">North</MenuItem>
              <MenuItem value="South">South</MenuItem>
              <MenuItem value="East">East</MenuItem>
              <MenuItem value="West">West</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Room Configuration"
            value={rooms}
            onChange={(e) => setRooms(e.target.value)}
            placeholder="e.g., 3 Bedrooms, 2 Bathrooms, Kitchen, Living Room"
            sx={{ flex: 2, minWidth: 300 }}
          />

          <TextField
            label="Number of Floors"
            type="number"
            value={floors}
            onChange={(e) => setFloors(Number(e.target.value))}
            inputProps={{ min: 1, max: 5 }}
            sx={{ flex: 1, minWidth: 150 }}
          />
        </Box>

        {/* Optional Details */}
        <Typography variant="h6" gutterBottom>
          Optional Details
        </Typography>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Location (City/Region)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Mumbai, Delhi"
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={vastuCompliance}
                onChange={(e) => setVastuCompliance(e.target.checked)}
              />
            }
            label="Enable Vastu Compliance"
          />
        </Box>

        {/* Generate Button */}
        <Button
          variant="contained"
          size="large"
          onClick={generateFloorPlan}
          disabled={loading || (!projectId && !selectedProject)}
          fullWidth
          sx={{ mt: 2 }}
        >
          {loading ? 'Generating Floor Plan...' : 'Generate AI Floor Plan'}
        </Button>

        {!projectId && !selectedProject && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Please select a project to generate a floor plan
          </Alert>
        )}
      </Paper>
    </Box>
  );
};

export default FloorPlanGenerator;