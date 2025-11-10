import React, { useState } from 'react';
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
  Chip,
  Alert,
  Checkbox,
  FormControlLabel,
  Divider
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  TrendingUp as TrendIcon
} from '@mui/icons-material';
import api from '../../services/api';

interface PricePredictionResult {
  estimatedPrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  confidence: number;
  breakdown: {
    basePrice: number;
    areaContribution: number;
    bedroomContribution: number;
    bathroomContribution: number;
    ageAdjustment: number;
    locationPremium: number;
    conditionAdjustment: number;
  };
}

const PricePrediction: React.FC = () => {
  const [formData, setFormData] = useState({
    area: 1500,
    bedrooms: 3,
    bathrooms: 2,
    age: 5,
    location: 'suburban',
    condition: 'good',
    amenities: [] as string[]
  });

  const [prediction, setPrediction] = useState<PricePredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const AMENITIES = ['garage', 'garden', 'pool', 'basement', 'balcony'];

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const toggleAmenity = (amenity: string) => {
    const newAmenities = formData.amenities.includes(amenity)
      ? formData.amenities.filter((a: string) => a !== amenity)
      : [...formData.amenities, amenity];
    setFormData({ ...formData, amenities: newAmenities });
  };

  const predictPrice = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/price-prediction/predict', formData);
      setPrediction(response.data.prediction);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to predict price');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    // Format using Indian Rupee locale
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      currencyDisplay: 'narrowSymbol'
    }).format(amount);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <MoneyIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4">
            House Price Prediction
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
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
                value={formData.area}
                onChange={(e) => handleInputChange('area', Number(e.target.value))}
                inputProps={{ min: 100, max: 10000 }}
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Bedrooms"
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => handleInputChange('bedrooms', Number(e.target.value))}
                  inputProps={{ min: 1, max: 10 }}
                />

                <TextField
                  fullWidth
                  label="Bathrooms"
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => handleInputChange('bathrooms', Number(e.target.value))}
                  inputProps={{ min: 1, max: 10 }}
                />
              </Box>

              <TextField
                fullWidth
                label="Property Age (years)"
                type="number"
                value={formData.age}
                onChange={(e) => handleInputChange('age', Number(e.target.value))}
                inputProps={{ min: 0, max: 100 }}
              />

              <FormControl fullWidth>
                <InputLabel>Location Type</InputLabel>
                <Select
                  value={formData.location}
                  label="Location Type"
                  onChange={(e) => handleInputChange('location', e.target.value)}
                >
                  <MenuItem value="urban">Urban</MenuItem>
                  <MenuItem value="suburban">Suburban</MenuItem>
                  <MenuItem value="rural">Rural</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Condition</InputLabel>
                <Select
                  value={formData.condition}
                  label="Condition"
                  onChange={(e) => handleInputChange('condition', e.target.value)}
                >
                  <MenuItem value="excellent">Excellent</MenuItem>
                  <MenuItem value="good">Good</MenuItem>
                  <MenuItem value="fair">Fair</MenuItem>
                  <MenuItem value="poor">Poor</MenuItem>
                </Select>
              </FormControl>

              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Amenities
                </Typography>
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
              onClick={predictPrice}
              disabled={loading}
            >
              {loading ? 'Calculating...' : 'Predict Price'}
            </Button>
          </Box>

          {/* Results */}
          <Box sx={{ flex: 1 }}>
            {prediction ? (
              <>
                <Typography variant="h6" gutterBottom>
                  Price Estimate
                </Typography>

                <Card sx={{ mb: 2, bgcolor: 'primary.light', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h3" align="center" gutterBottom>
                      {formatCurrency(prediction.estimatedPrice)}
                    </Typography>
                    <Typography variant="body1" align="center">
                      Estimated Market Value
                    </Typography>
                    <Divider sx={{ my: 2, bgcolor: 'white', opacity: 0.3 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="body2">Low Estimate</Typography>
                        <Typography variant="h6">
                          {formatCurrency(prediction.priceRange.min)}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2">High Estimate</Typography>
                        <Typography variant="h6">
                          {formatCurrency(prediction.priceRange.max)}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                      <Chip
                        label={`${(prediction.confidence * 100).toFixed(0)}% Confidence`}
                        sx={{ bgcolor: 'white', color: 'primary.main' }}
                      />
                    </Box>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Price Breakdown
                    </Typography>

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
                        <Typography variant="body2">Area ({formData.area} sq ft)</Typography>
                        <Typography variant="body2" color="success.main">
                          +{formatCurrency(prediction.breakdown.areaContribution)}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Bedrooms ({formData.bedrooms})</Typography>
                        <Typography variant="body2" color="success.main">
                          +{formatCurrency(prediction.breakdown.bedroomContribution)}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Bathrooms ({formData.bathrooms})</Typography>
                        <Typography variant="body2" color="success.main">
                          +{formatCurrency(prediction.breakdown.bathroomContribution)}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Location Premium</Typography>
                        <Typography variant="body2" color="success.main">
                          +{formatCurrency(prediction.breakdown.locationPremium)}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Condition Adjustment</Typography>
                        <Typography
                          variant="body2"
                          color={prediction.breakdown.conditionAdjustment >= 0 ? 'success.main' : 'error.main'}
                        >
                          {prediction.breakdown.conditionAdjustment >= 0 ? '+' : ''}
                          {formatCurrency(prediction.breakdown.conditionAdjustment)}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Age Depreciation</Typography>
                        <Typography variant="body2" color="error.main">
                          {formatCurrency(prediction.breakdown.ageAdjustment)}
                        </Typography>
                      </Box>
                    </Box>

                    {formData.amenities.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" gutterBottom>
                          Amenities Included:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {formData.amenities.map((amenity) => (
                            <Chip key={amenity} label={amenity} size="small" color="primary" />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
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
                  Enter property details to get price estimate
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
