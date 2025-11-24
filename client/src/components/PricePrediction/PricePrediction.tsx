import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Autocomplete,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  TrendingUp as TrendIcon
} from '@mui/icons-material';
import { costEstimatesAPI, projectsAPI, floorPlansAPI } from '../../services/api';
import { Project, CostEstimate } from '../../types';
import { FloorPlan } from '../../types/floorPlan.types';

interface CostEstimateComponentProps {
  projectId?: string;
  floorPlanId?: string;
}

const PricePrediction: React.FC<CostEstimateComponentProps> = ({ 
  projectId: propProjectId, 
  floorPlanId: propFloorPlanId 
}) => {
  const { projectId: urlProjectId, floorPlanId: urlFloorPlanId } = useParams<{ 
    projectId: string; 
    floorPlanId: string;  
  }>();
  
  const projectId = propProjectId || urlProjectId;
  const floorPlanId = propFloorPlanId || urlFloorPlanId;

  // Property details
  const [area, setArea] = useState<number>(1500);
  const [propertyType, setPropertyType] = useState<'residential' | 'commercial'>('residential');
  const [floors, setFloors] = useState<number>(1);
  const [qualityLevel, setQualityLevel] = useState<'basic' | 'standard' | 'premium'>('standard');

  // Project/Floor plan selection for standalone usage
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedFloorPlan, setSelectedFloorPlan] = useState<FloorPlan | null>(null);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [availableFloorPlans, setAvailableFloorPlans] = useState<FloorPlan[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [floorPlansLoading, setFloorPlansLoading] = useState(false);

  const [estimate, setEstimate] = useState<CostEstimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load project and floor plan if IDs provided
  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
    }
  }, [projectId]);

  useEffect(() => {
    if (floorPlanId) {
      loadFloorPlan(floorPlanId);
    }
  }, [floorPlanId]);

  // Search projects for standalone usage
  useEffect(() => {
    if (!projectId && projectSearchQuery.length > 0) {
      searchProjects(projectSearchQuery);
    }
  }, [projectSearchQuery, projectId]);

  // Load floor plans when project is selected
  useEffect(() => {
    if (selectedProject && !floorPlanId) {
      loadProjectFloorPlans(selectedProject._id);
    }
  }, [selectedProject, floorPlanId]);

  const loadProject = async (id: string) => {
    try {
      const project = await projectsAPI.getProject(id);
      setSelectedProject(project);
      // Pre-fill inputs from project
      if (project.propertyDetails?.dimensions) {
        const dims = project.propertyDetails.dimensions;
        if (dims.unit === 'feet') {
          setArea(dims.length * dims.width);
        }
      }
      if (project.propertyDetails?.type) {
        if (project.propertyDetails.type === 'residential' || project.propertyDetails.type === 'commercial') {
          setPropertyType(project.propertyDetails.type);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load project');
    }
  };

  const loadFloorPlan = async (id: string) => {
    try {
      const floorPlan = await floorPlansAPI.get(id);
      setSelectedFloorPlan(floorPlan);
      // Pre-fill inputs from floor plan
      const plotArea = floorPlan.plot_summary.plot_width_ft * floorPlan.plot_summary.plot_length_ft;
      setArea(plotArea);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load floor plan');
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

  const loadProjectFloorPlans = async (projId: string) => {
    setFloorPlansLoading(true);
    try {
      const floorPlans = await floorPlansAPI.list(projId);
      setAvailableFloorPlans(floorPlans);
    } catch (err) {
      console.error('Failed to load floor plans:', err);
    } finally {
      setFloorPlansLoading(false);
    }
  };

  const calculateCost = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validate that we have a project
      if (!projectId && !selectedProject) {
        setError('Please select a project to calculate cost');
        setLoading(false);
        return;
      }

      const targetProjectId = projectId || selectedProject!._id;
      const targetFloorPlanId = floorPlanId || selectedFloorPlan?._id;

      const inputs = {
        area,
        propertyType,
        floors,
        qualityLevel,
      };

      const costEstimate = await costEstimatesAPI.calculate(
        targetProjectId,
        targetFloorPlanId,
        inputs
      );
      
      setEstimate(costEstimate);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to calculate cost estimate');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <MoneyIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4">
            Cost Estimation
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
              onChange={(_, newValue) => {
                setSelectedProject(newValue);
                setSelectedFloorPlan(null);
                if (newValue) loadProjectFloorPlans(newValue._id);
              }}
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

        {/* Floor Plan Selection (optional) */}
        {!floorPlanId && selectedProject && availableFloorPlans.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Select Floor Plan (Optional)
            </Typography>
            <Autocomplete
              options={availableFloorPlans}
              getOptionLabel={(option) => option.name || `Version ${option.version}`}
              value={selectedFloorPlan}
              onChange={(_, newValue) => setSelectedFloorPlan(newValue)}
              loading={floorPlansLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select floor plan for cost calculation"
                  placeholder="Optional - costs will be based on floor plan dimensions"
                />
              )}
            />
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Input Form */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              Property Details
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Total Area (sq ft)"
                type="number"
                value={area}
                onChange={(e) => setArea(Number(e.target.value))}
                inputProps={{ min: 100, max: 50000 }}
              />

              <FormControl fullWidth>
                <InputLabel>Property Type</InputLabel>
                <Select
                  value={propertyType}
                  label="Property Type"
                  onChange={(e) => setPropertyType(e.target.value as 'residential' | 'commercial')}
                >
                  <MenuItem value="residential">Residential</MenuItem>
                  <MenuItem value="commercial">Commercial</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Number of Floors"
                type="number"
                value={floors}
                onChange={(e) => setFloors(Number(e.target.value))}
                inputProps={{ min: 1, max: 10 }}
              />

              <FormControl fullWidth>
                <InputLabel>Quality Level</InputLabel>
                <Select
                  value={qualityLevel}
                  label="Quality Level"
                  onChange={(e) => setQualityLevel(e.target.value as 'basic' | 'standard' | 'premium')}
                >
                  <MenuItem value="basic">Basic (₹800-1200/sq ft)</MenuItem>
                  <MenuItem value="standard">Standard (₹1200-1800/sq ft)</MenuItem>
                  <MenuItem value="premium">Premium (₹1800-3000/sq ft)</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Button
              variant="contained"
              size="large"
              fullWidth
              sx={{ mt: 3 }}
              onClick={calculateCost}
              disabled={loading || (!projectId && !selectedProject)}
            >
              {loading ? 'Calculating...' : 'Calculate Cost'}
            </Button>

            {!projectId && !selectedProject && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Please select a project to calculate cost estimate
              </Alert>
            )}
          </Box>

          {/* Results */}
          <Box sx={{ flex: 1 }}>
            {estimate ? (
              <>
                <Typography variant="h6" gutterBottom>
                  Cost Estimate
                </Typography>

                <Card sx={{ mb: 2, bgcolor: 'primary.light', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h3" align="center" gutterBottom>
                      {formatCurrency(estimate.total)}
                    </Typography>
                    <Typography variant="body1" align="center">
                      Total Estimated Cost
                    </Typography>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Cost Breakdown
                    </Typography>

                    <Box sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Materials</Typography>
                        <Typography variant="body2">
                          {formatCurrency(estimate.materials)}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Labor</Typography>
                        <Typography variant="body2">
                          {formatCurrency(estimate.labor)}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Permits & Approvals</Typography>
                        <Typography variant="body2">
                          {formatCurrency(estimate.permits)}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Equipment</Typography>
                        <Typography variant="body2">
                          {formatCurrency(estimate.equipment)}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {estimate.breakdown && estimate.breakdown.length > 0 && (
                      <>
                        <Typography variant="subtitle2" gutterBottom>
                          Detailed Breakdown:
                        </Typography>
                        {estimate.breakdown.map((item, index) => (
                          <Box key={index} sx={{ mb: 1, pl: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="caption">
                                {item.item} ({item.quantity} {item.unit})
                              </Typography>
                              <Typography variant="caption">
                                {formatCurrency(item.totalCost)}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </>
                    )}
                  </CardContent>
                </Card>

                <Alert severity="info" sx={{ mt: 2 }}>
                  Cost estimate saved to project. Version {estimate.version}
                  {estimate.isActive && ' (Active)'}
                </Alert>
              </>
            ) : (
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  color: 'text.secondary'
                }}
              >
                <TrendIcon sx={{ fontSize: 100, mb: 2, opacity: 0.3 }} />
                <Typography variant="h6">
                  Enter property details to calculate cost
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default PricePrediction;