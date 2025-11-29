import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Divider,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  TrendingUp as TrendIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { projectsAPI, floorPlansAPI } from '../../services/api';
import api from '../../services/api';
import { Project } from '../../types';
import { FloorPlan } from '../../types/floorPlan.types';

interface CostEstimateComponentProps {
  projectId?: string;
  floorPlanId?: string;
}

const AMENITIES = ['garage', 'garden', 'pool', 'basement', 'balcony'];

const PricePrediction: React.FC<CostEstimateComponentProps> = ({
  projectId: propProjectId,
  floorPlanId: propFloorPlanId
}) => {
  const navigate = useNavigate();
  const { projectId: urlProjectId, floorPlanId: urlFloorPlanId } = useParams<{
    projectId: string;
    floorPlanId: string;
  }>();

  const projectId = propProjectId || urlProjectId;
  const floorPlanId = propFloorPlanId || urlFloorPlanId;

  // Form Data for ML Prediction
  const [formData, setFormData] = useState({
    area: 1500,
    bedrooms: 3,
    bathrooms: 2,
    age: 5,
    location: 'Suburban',
    condition: 'Good',
    amenities: [] as string[]
  });

  // Project/Floor plan selection for standalone usage
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedFloorPlan, setSelectedFloorPlan] = useState<FloorPlan | null>(null);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [availableFloorPlans, setAvailableFloorPlans] = useState<FloorPlan[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [floorPlansLoading, setFloorPlansLoading] = useState(false);

  const [prediction, setPrediction] = useState<any | null>(null);
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
          setFormData(prev => ({ ...prev, area: dims.length * dims.width }));
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
      if (floorPlan && floorPlan.plot_summary) {
        const plotArea = floorPlan.plot_summary.plot_width_ft * floorPlan.plot_summary.plot_length_ft;
        setFormData(prev => ({ ...prev, area: plotArea }));
      }
    } catch (err: any) {
      console.error('Failed to load floor plan:', err);
      // If it's a 404 or invalid ID, just ignore and let user select manually or proceed without it
      if (err.response?.status === 404 || err.response?.status === 400) {
        // Don't show error to user, just log it
        console.log('Floor plan not found or invalid ID, proceeding without it');
      } else {
        setError(err.response?.data?.message || 'Failed to load floor plan');
      }
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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => {
      const newAmenities = prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity];
      return { ...prev, amenities: newAmenities };
    });
  };

  const calculatePrice = async () => {
    setLoading(true);
    setError(null);

    try {
      // Use the new ML-based prediction endpoint
      const response = await api.post('/price-prediction/ml-predict', formData);
      if (response.data.success) {
        setPrediction(response.data.prediction);
      } else {
        setError(response.data.message || 'Prediction failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to calculate price prediction');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    }
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
            Market Price Prediction
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
              Select Project (Optional)
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

            {selectedProject && (
              <Autocomplete
                sx={{ mt: 2 }}
                options={availableFloorPlans}
                getOptionLabel={(option) => option.name || 'Unnamed Floor Plan'}
                value={selectedFloorPlan}
                onChange={(_, newValue) => {
                  setSelectedFloorPlan(newValue);
                  if (newValue) loadFloorPlan(newValue._id);
                }}
                loading={floorPlansLoading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Floor Plan (Optional)"
                    placeholder="Choose a floor plan to auto-fill details"
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {floorPlansLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
            )}

            <Divider sx={{ mt: 3 }} />
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Input Form */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              Property Details
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField
                fullWidth
                label="Total Area (sq ft)"
                type="number"
                value={formData.area}
                onChange={(e) => handleInputChange('area', Number(e.target.value))}
                inputProps={{ min: 100 }}
              />
              <TextField
                fullWidth
                label="Age (Years)"
                type="number"
                value={formData.age}
                onChange={(e) => handleInputChange('age', Number(e.target.value))}
                inputProps={{ min: 0 }}
              />
              <TextField
                fullWidth
                label="Bedrooms"
                type="number"
                value={formData.bedrooms}
                onChange={(e) => handleInputChange('bedrooms', Number(e.target.value))}
                inputProps={{ min: 0 }}
              />
              <TextField
                fullWidth
                label="Bathrooms"
                type="number"
                value={formData.bathrooms}
                onChange={(e) => handleInputChange('bathrooms', Number(e.target.value))}
                inputProps={{ min: 0 }}
              />
              <FormControl fullWidth>
                <InputLabel>Location</InputLabel>
                <Select
                  value={formData.location}
                  label="Location"
                  onChange={(e) => handleInputChange('location', e.target.value)}
                >
                  <MenuItem value="Urban">Urban</MenuItem>
                  <MenuItem value="Suburban">Suburban</MenuItem>
                  <MenuItem value="Rural">Rural</MenuItem>
                  <MenuItem value="Downtown">Downtown</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Condition</InputLabel>
                <Select
                  value={formData.condition}
                  label="Condition"
                  onChange={(e) => handleInputChange('condition', e.target.value)}
                >
                  <MenuItem value="Excellent">Excellent</MenuItem>
                  <MenuItem value="Good">Good</MenuItem>
                  <MenuItem value="Fair">Fair</MenuItem>
                  <MenuItem value="Poor">Poor</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Amenities
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {AMENITIES.map((amenity) => (
                  <FormControlLabel
                    key={amenity}
                    control={
                      <Checkbox
                        checked={formData.amenities.includes(amenity)}
                        onChange={() => toggleAmenity(amenity)}
                      />
                    }
                    label={amenity.charAt(0).toUpperCase() + amenity.slice(1)}
                  />
                ))}
              </Box>
            </Box>

            <Button
              variant="contained"
              size="large"
              fullWidth
              sx={{ mt: 3 }}
              onClick={calculatePrice}
              disabled={loading}
            >
              {loading ? 'Calculating...' : 'Predict Price'}
            </Button>

            {projectId && prediction && (
              <Button
                variant="outlined"
                size="large"
                fullWidth
                sx={{ mt: 2 }}
                startIcon={<CheckCircleIcon />}
                onClick={() => navigate(`/project/${projectId}`)}
              >
                Finish & View Project
              </Button>
            )}
          </Box>

          {/* Results */}
          <Box sx={{ flex: 1 }}>
            {prediction ? (
              <>
                <Typography variant="h6" gutterBottom>
                  Price Prediction
                </Typography>

                <Card sx={{ mb: 2, bgcolor: 'primary.light', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h3" align="center" gutterBottom>
                      {formatCurrency(prediction.estimatedPrice)}
                    </Typography>
                    <Typography variant="body1" align="center">
                      Estimated Market Value
                    </Typography>
                    <Typography variant="caption" display="block" align="center" sx={{ mt: 1 }}>
                      Range: {formatCurrency(prediction.priceRange.min)} - {formatCurrency(prediction.priceRange.max)}
                    </Typography>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Value Breakdown
                    </Typography>

                    {prediction.breakdown && (
                      <>
                        <Box sx={{ mb: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">Base Price</Typography>
                            <Typography variant="body2">
                              {formatCurrency(prediction.breakdown.basePrice)}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ mb: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">Area Value</Typography>
                            <Typography variant="body2">
                              {formatCurrency(prediction.breakdown.areaContribution)}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ mb: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">Location Premium</Typography>
                            <Typography variant="body2">
                              {formatCurrency(prediction.breakdown.locationPremium)}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ mb: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">Condition Adjustment</Typography>
                            <Typography variant="body2">
                              {formatCurrency(prediction.breakdown.conditionAdjustment)}
                            </Typography>
                          </Box>
                        </Box>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Alert severity="info" sx={{ mt: 2 }}>
                  Confidence: {(prediction.confidence * 100).toFixed(0)}%
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
                  Enter details to predict market price
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