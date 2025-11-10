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

interface PricePredictionBreakdown {
  basePrice?: number | null;
  areaContribution?: number | null;
  bedroomContribution?: number | null;
  bathroomContribution?: number | null;
  floorsContribution?: number | null;
  ageAdjustment?: number | null;
  locationPremium?: number | null;
  conditionAdjustment?: number | null;
  garageContribution?: number | null;
  otherAmenitiesContribution?: number | null;
}

interface PricePredictionResult {
  estimatedPrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  confidence: number;
  breakdown: PricePredictionBreakdown;
}

interface PredictionState {
  result: PricePredictionResult;
  modelUsed: string;
  currency: string;
  timestamp: string;
}

type FormState = {
  area: number;
  bedrooms: number;
  bathrooms: number;
  floors: number;
  age: number;
  location: string;
  condition: string;
  amenities: string[];
};

const DEFAULT_FORM: FormState = {
  area: 1500,
  bedrooms: 3,
  bathrooms: 2,
  floors: 1,
  age: 5,
  location: 'suburban',
  condition: 'good',
  amenities: []
};

const AMENITIES = ['garage', 'garden', 'pool', 'basement', 'balcony'];

const PricePrediction: React.FC = () => {
  const [formData, setFormData] = useState<FormState>(DEFAULT_FORM);
  const [prediction, setPrediction] = useState<PredictionState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof FormState, value: number | string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter(a => a !== amenity)
          : [...prev.amenities, amenity]
      };
    });
  };

  const predictPrice = async () => {
    setLoading(true);
    setError(null);

    try {
      // Build feature payload expected by backend predictor schema
      const payload = {
        features: {
          area: formData.area,
          bedrooms: formData.bedrooms,
          bathrooms: formData.bathrooms,
          floors: formData.floors,
          age: formData.age,
          location: formData.location,
          condition: formData.condition,
          garage: formData.amenities.includes('garage'),
          amenities: formData.amenities,
        },
      };

      const response = await api.post('/predictor/predict', payload);
      const data = response.data;

      setPrediction({
        result: data.prediction,
        modelUsed: data.modelUsed,
        currency: data.currency,
        timestamp: data.timestamp,
      });
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (detail?.message) {
        setError(detail.message);
      } else {
        setError(err.response?.data?.message || 'Failed to predict price');
      }
    } finally {
      setLoading(false);
    }
  };

  const currency = prediction?.currency ?? 'INR';
  const result = prediction?.result;
  const breakdown = result?.breakdown ?? {};

  const formatCurrency = (amount: number, currencyCode: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      currencyDisplay: 'narrowSymbol'
    }).format(amount);
  };

  const getSafeNumber = (value?: number | null): number => {
    return typeof value === 'number' && !Number.isNaN(value) ? value : 0;
  };

  const getContributionColor = (value: number) => (value >= 0 ? 'success.main' : 'error.main');

  const formatSignedCurrency = (value: number) => {
    if (value === 0) {
      return formatCurrency(0, currency);
    }
    const sign = value >= 0 ? '+' : '-';
    return `${sign}${formatCurrency(Math.abs(value), currency)}`;
  };

  // Display contribution rows only when relevant (skips zero unless forced)
  const renderContributionRow = (
    label: string,
    rawValue?: number | null,
    options: { showWhenZero?: boolean } = {}
  ) => {
    const value = getSafeNumber(rawValue);
    if (!options.showWhenZero && value === 0) {
      return null;
    }

    return (
      <Box sx={{ mb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2">{label}</Typography>
          <Typography variant="body2" color={getContributionColor(value)}>
            {formatSignedCurrency(value)}
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <MoneyIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4">House Price Prediction</Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
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
                inputProps={{ min: 100, max: 20000 }}
              />

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                  label="Bedrooms"
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => handleInputChange('bedrooms', Number(e.target.value))}
                  inputProps={{ min: 0, max: 10 }}
                  sx={{ flex: 1, minWidth: 120 }}
                />
                <TextField
                  label="Bathrooms"
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => handleInputChange('bathrooms', Number(e.target.value))}
                  inputProps={{ min: 0, max: 10 }}
                  sx={{ flex: 1, minWidth: 120 }}
                />
                <TextField
                  label="Floors"
                  type="number"
                  value={formData.floors}
                  onChange={(e) => handleInputChange('floors', Number(e.target.value))}
                  inputProps={{ min: 1, max: 5 }}
                  sx={{ flex: 1, minWidth: 120 }}
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

          <Box sx={{ flex: 1 }}>
            {prediction && result ? (
              <>
                <Typography variant="h6" gutterBottom>
                  Price Estimate
                </Typography>

                <Card sx={{ mb: 2, bgcolor: 'primary.light', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h3" align="center" gutterBottom>
                      {formatCurrency(result.estimatedPrice, currency)}
                    </Typography>
                    <Typography variant="body1" align="center">
                      Estimated Market Value
                    </Typography>
                    <Divider sx={{ my: 2, bgcolor: 'white', opacity: 0.3 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="body2">Low Estimate</Typography>
                        <Typography variant="h6">
                          {formatCurrency(result.priceRange.min, currency)}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2">High Estimate</Typography>
                        <Typography variant="h6">
                          {formatCurrency(result.priceRange.max, currency)}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                      <Chip
                        label={`${(result.confidence * 100).toFixed(0)}% Confidence`}
                        sx={{ bgcolor: 'white', color: 'primary.main' }}
                      />
                    </Box>
                    <Typography variant="body2" align="center" sx={{ mt: 2 }}>
                      Model used: {prediction.modelUsed.toUpperCase()}
                    </Typography>
                    <Typography variant="caption" align="center" display="block">
                      Generated {new Date(prediction.timestamp).toLocaleString()}
                    </Typography>
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
                          {formatCurrency(getSafeNumber(breakdown.basePrice), currency)}
                        </Typography>
                      </Box>
                    </Box>

                    {renderContributionRow(`Area (${formData.area} sq ft)`, breakdown.areaContribution)}
                    {renderContributionRow(`Bedrooms (${formData.bedrooms})`, breakdown.bedroomContribution)}
                    {renderContributionRow(`Bathrooms (${formData.bathrooms})`, breakdown.bathroomContribution)}
                    {renderContributionRow(`Floors (${formData.floors})`, breakdown.floorsContribution)}
                    {renderContributionRow('Location Premium', breakdown.locationPremium)}
                    {renderContributionRow('Condition Adjustment', breakdown.conditionAdjustment, { showWhenZero: true })}
                    {renderContributionRow('Garage Impact', breakdown.garageContribution)}
                    {renderContributionRow('Amenities Impact', breakdown.otherAmenitiesContribution)}
                    {renderContributionRow('Age Adjustment', breakdown.ageAdjustment, { showWhenZero: true })}

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
                <Typography variant="h6" align="center">
                  Enter property details to get a price estimate.
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default PricePrediction;import React, { useState } from 'react';
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

interface PricePredictionBreakdown {
  basePrice?: number | null;
  areaContribution?: number | null;
  bedroomContribution?: number | null;
  bathroomContribution?: number | null;
  floorsContribution?: number | null;
  ageAdjustment?: number | null;
  locationPremium?: number | null;
  conditionAdjustment?: number | null;
  garageContribution?: number | null;
  otherAmenitiesContribution?: number | null;
}

interface PricePredictionResult {
  estimatedPrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  confidence: number;
  breakdown: PricePredictionBreakdown;
}

interface PredictionState {
  result: PricePredictionResult;
  modelUsed: string;
  currency: string;
  timestamp: string;
}

type FormState = {
  area: number;
  bedrooms: number;
  bathrooms: number;
  floors: number;
  age: number;
  location: string;
  condition: string;
  amenities: string[];
};

const DEFAULT_FORM: FormState = {
  area: 1500,
  bedrooms: 3,
  bathrooms: 2,
  floors: 1,
  age: 5,
  location: 'suburban',
  condition: 'good',
  amenities: []
};

const AMENITIES = ['garage', 'garden', 'pool', 'basement', 'balcony'];

const PricePrediction: React.FC = () => {
  const [formData, setFormData] = useState<FormState>(DEFAULT_FORM);
  const [prediction, setPrediction] = useState<PredictionState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof FormState, value: number | string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter(a => a !== amenity)
          : [...prev.amenities, amenity]
      };
    });
  };

  const predictPrice = async () => {
    setLoading(true);
    setError(null);

    try {
      const payload = {
        features: {
          area: formData.area,
          bedrooms: formData.bedrooms,
          bathrooms: formData.bathrooms,
          floors: formData.floors,
          age: formData.age,
          location: formData.location,
          condition: formData.condition,
          garage: formData.amenities.includes('garage'),
          amenities: formData.amenities,
        },
      };

      const response = await api.post('/predictor/predict', payload);
      const data = response.data;

      setPrediction({
        result: data.prediction,
        modelUsed: data.modelUsed,
        currency: data.currency,
        timestamp: data.timestamp,
      });
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (detail?.message) {
        setError(detail.message);
      } else {
        setError(err.response?.data?.message || 'Failed to predict price');
      }
    } finally {
      setLoading(false);
    }
  };

  const currency = prediction?.currency ?? 'INR';
  const result = prediction?.result;
  const breakdown = result?.breakdown ?? {};

  const formatCurrency = (amount: number, currencyCode: string) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      currencyDisplay: 'narrowSymbol'
    }).format(amount);
  };

  const getSafeNumber = (value?: number | null): number => {
    return typeof value === 'number' && !Number.isNaN(value) ? value : 0;
  };

  const getContributionColor = (value: number) => (value >= 0 ? 'success.main' : 'error.main');

  const formatSignedCurrency = (value: number) => {
    if (value === 0) {
      return formatCurrency(0, currency);
    }
    const sign = value >= 0 ? '+' : '-';
    return `${sign}${formatCurrency(Math.abs(value), currency)}`;
  };

  const renderContributionRow = (
    label: string,
    rawValue?: number | null,
    options: { showWhenZero?: boolean } = {}
  ) => {
    const value = getSafeNumber(rawValue);
    if (!options.showWhenZero && value === 0) {
      return null;
    }

    return (
      <Box sx={{ mb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2">{label}</Typography>
          <Typography variant="body2" color={getContributionColor(value)}>
            {formatSignedCurrency(value)}
          </Typography>
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <MoneyIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4">House Price Prediction</Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
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
                inputProps={{ min: 100, max: 20000 }}
              />

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                  label="Bedrooms"
                  type="number"
                  value={formData.bedrooms}
                  onChange={(e) => handleInputChange('bedrooms', Number(e.target.value))}
                  inputProps={{ min: 0, max: 10 }}
                  sx={{ flex: 1, minWidth: 120 }}
                />
                <TextField
                  label="Bathrooms"
                  type="number"
                  value={formData.bathrooms}
                  onChange={(e) => handleInputChange('bathrooms', Number(e.target.value))}
                  inputProps={{ min: 0, max: 10 }}
                  sx={{ flex: 1, minWidth: 120 }}
                />
                <TextField
                  label="Floors"
                  type="number"
                  value={formData.floors}
                  onChange={(e) => handleInputChange('floors', Number(e.target.value))}
                  inputProps={{ min: 1, max: 5 }}
                  sx={{ flex: 1, minWidth: 120 }}
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
              sx{{ mt: 3 }}
              onClick={predictPrice}
              disabled={loading}
            >
              {loading ? 'Calculating...' : 'Predict Price'}
            </Button>
          </Box>

          <Box sx={{ flex: 1 }}>
            {prediction && result ? (
              <>
                <Typography variant="h6" gutterBottom>
                  Price Estimate
                </Typography>

                <Card sx{{ mb: 2, bgcolor: 'primary.light', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h3" align="center" gutterBottom>
                      {formatCurrency(result.estimatedPrice, currency)}
                    </Typography>
                    <Typography variant="body1" align="center">
                      Estimated Market Value
                    </Typography>
                    <Divider sx{{ my: 2, bgcolor: 'white', opacity: 0.3 }} />
                    <Box sx{{ display: 'flex', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="body2">Low Estimate</Typography>
                        <Typography variant="h6">
                          {formatCurrency(result.priceRange.min, currency)}
                        </Typography>
                      </Box>
                      <Box sx{{ textAlign: 'right' }}>
                        <Typography variant="body2">High Estimate</Typography>
                        <Typography variant="h6">
                          {formatCurrency(result.priceRange.max, currency)}
                        </Typography>
                      </Box>
                    </Box>
                    <Box sx{{ mt: 2, textAlign: 'center' }}>
                      <Chip
                        label={`${(result.confidence * 100).toFixed(0)}% Confidence`}
                        sx{{ bgcolor: 'white', color: 'primary.main' }}
                      />
                    </Box>
                    <Typography variant="body2" align="center" sx{{ mt: 2 }}>
                      Model used: {prediction.modelUsed.toUpperCase()}
                    </Typography>
                    <Typography variant="caption" align="center" display="block">
                      Generated {new Date(prediction.timestamp).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Price Breakdown
                    </Typography>

                    <Box sx{{ mb: 1 }}>
                      <Box sx{{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Base Price</Typography>
                        <Typography variant="body2">
                          {formatCurrency(getSafeNumber(breakdown.basePrice), currency)}
                        </Typography>
                      </Box>
                    </Box>

                    {renderContributionRow(`Area (${formData.area} sq ft)`, breakdown.areaContribution)}
                    {renderContributionRow(`Bedrooms (${formData.bedrooms})`, breakdown.bedroomContribution)}
                    {renderContributionRow(`Bathrooms (${formData.bathrooms})`, breakdown.bathroomContribution)}
                    {renderContributionRow(`Floors (${formData.floors})`, breakdown.floorsContribution)}
                    {renderContributionRow('Location Premium', breakdown.locationPremium)}
                    {renderContributionRow('Condition Adjustment', breakdown.conditionAdjustment, { showWhenZero: true })}
                    {renderContributionRow('Garage Impact', breakdown.garageContribution)}
                    {renderContributionRow('Amenities Impact', breakdown.otherAmenitiesContribution)}
                    {renderContributionRow('Age Adjustment', breakdown.ageAdjustment, { showWhenZero: true })}

                    {formData.amenities.length > 0 && (
                      <Box sx{{ mt: 2 }}>
                        <Typography variant="body2" gutterBottom>
                          Amenities Included:
                        </Typography>
                        <Box sx{{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
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
                sx{{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  color: 'text.secondary'
                }}
              >
                <TrendIcon sx{{ fontSize: 100, mb: 2, opacity: 0.3 }} />
                <Typography variant="h6" align="center">
                  Enter property details to get a price estimate.
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default PricePrediction;import React, { useState } from 'react';import React, { useState } from 'react';

import {import {

  Box,  Box,

  Paper,  Paper,

  Typography,  Typography,

  TextField,  TextField,

  Button,  Button,

  Card,  Card,

  CardContent,  CardContent,

  Select,  Select,

  MenuItem,  MenuItem,

  FormControl,  FormControl,

  InputLabel,  InputLabel,

  Chip,  Chip,

  Alert,  Alert,

  Checkbox,  Checkbox,

  FormControlLabel,  FormControlLabel,

  Divider  Divider

} from '@mui/material';} from '@mui/material';

import {import {

  AttachMoney as MoneyIcon,  AttachMoney as MoneyIcon,

  TrendingUp as TrendIcon  TrendingUp as TrendIcon

} from '@mui/icons-material';} from '@mui/icons-material';

import api from '../../services/api';import api from '../../services/api';



interface PricePredictionBreakdown {interface PricePredictionBreakdown {

  basePrice?: number | null;  basePrice?: number | null;

  areaContribution?: number | null;  areaContribution?: number | null;

  bedroomContribution?: number | null;  bedroomContribution?: number | null;

  bathroomContribution?: number | null;  bathroomContribution?: number | null;

  floorsContribution?: number | null;  floorsContribution?: number | null;

  ageAdjustment?: number | null;  ageAdjustment?: number | null;

  locationPremium?: number | null;  locationPremium?: number | null;

  conditionAdjustment?: number | null;  conditionAdjustment?: number | null;

  garageContribution?: number | null;  garageContribution?: number | null;

  otherAmenitiesContribution?: number | null;  otherAmenitiesContribution?: number | null;

}}



interface PricePredictionResult {interface PricePredictionResult {

  estimatedPrice: number;  estimatedPrice: number;

  priceRange: {  priceRange: {

    min: number;    min: number;

    max: number;    max: number;

  };  };

  confidence: number;  confidence: number;

  breakdown: PricePredictionBreakdown;  breakdown: PricePredictionBreakdown;

}}



interface PredictionState {interface PredictionState {

  result: PricePredictionResult;  result: PricePredictionResult;

  modelUsed: string;  modelUsed: string;

  currency: string;  currency: string;

  timestamp: string;  timestamp: string;

}}



type FormState = {const PricePrediction: React.FC = () => {

  area: number;  const [formData, setFormData] = useState({

  bedrooms: number;    area: 1500,

  bathrooms: number;    bedrooms: 3,

  floors: number;    bathrooms: 2,

  age: number;    floors: 1,

  location: string;    age: 5,

  condition: string;    location: 'suburban',

  amenities: string[];    condition: 'good',

};    amenities: [] as string[]

  });

const DEFAULT_FORM: FormState = {

  area: 1500,  const [prediction, setPrediction] = useState<PredictionState | null>(null);

  bedrooms: 3,  const [loading, setLoading] = useState(false);

  bathrooms: 2,  const [error, setError] = useState<string | null>(null);

  floors: 1,

  age: 5,  const AMENITIES = ['garage', 'garden', 'pool', 'basement', 'balcony'];

  location: 'suburban',

  condition: 'good',  const handleInputChange = (field: string, value: any) => {

  amenities: []    setFormData({ ...formData, [field]: value });

};  };



const AMENITIES = ['garage', 'garden', 'pool', 'basement', 'balcony'];  const toggleAmenity = (amenity: string) => {

    const newAmenities = formData.amenities.includes(amenity)

const PricePrediction: React.FC = () => {      ? formData.amenities.filter((a: string) => a !== amenity)

  const [formData, setFormData] = useState<FormState>(DEFAULT_FORM);      : [...formData.amenities, amenity];

  const [prediction, setPrediction] = useState<PredictionState | null>(null);    setFormData({ ...formData, amenities: newAmenities });

  const [loading, setLoading] = useState(false);  };

  const [error, setError] = useState<string | null>(null);

  const predictPrice = async () => {

  const handleInputChange = (field: keyof FormState, value: number | string) => {    setLoading(true);

    setFormData(prev => ({ ...prev, [field]: value }));    setError(null);

  };

    try {

  const toggleAmenity = (amenity: string) => {      const payload = {

    setFormData(prev => {        features: {

      const exists = prev.amenities.includes(amenity);          area: formData.area,

      return {          bedrooms: formData.bedrooms,

        ...prev,          bathrooms: formData.bathrooms,

        amenities: exists          floors: formData.floors,

          ? prev.amenities.filter(a => a !== amenity)          age: formData.age,

          : [...prev.amenities, amenity]          location: formData.location,

      };          condition: formData.condition,

    });          garage: formData.amenities.includes('garage'),

  };          amenities: formData.amenities,

        },

  const predictPrice = async () => {      };

    setLoading(true);

    setError(null);      const response = await api.post('/predictor/predict', payload);

      const data = response.data;

    try {

      const payload = {      setPrediction({

        features: {        result: data.prediction,

          area: formData.area,        modelUsed: data.modelUsed,

          bedrooms: formData.bedrooms,        currency: data.currency,

          bathrooms: formData.bathrooms,        timestamp: data.timestamp,

          floors: formData.floors,      });

          age: formData.age,    } catch (err: any) {

          location: formData.location,      const detail = err.response?.data?.detail;

          condition: formData.condition,      if (typeof detail === 'string') {

          garage: formData.amenities.includes('garage'),        setError(detail);

          amenities: formData.amenities,      } else if (detail?.message) {

        },        setError(detail.message);

      };      } else {

        setError(err.response?.data?.message || 'Failed to predict price');

      const response = await api.post('/predictor/predict', payload);      }

      const data = response.data;    } finally {

      setLoading(false);

      setPrediction({    }

        result: data.prediction,  };

        modelUsed: data.modelUsed,

        currency: data.currency,  const formatCurrency = (amount: number, currency: string) => {

        timestamp: data.timestamp,    // Format using Indian Rupee locale

      });    return new Intl.NumberFormat('en-IN', {

    } catch (err: any) {      style: 'currency',

      const detail = err.response?.data?.detail;      currency,

      if (typeof detail === 'string') {      minimumFractionDigits: 0,

        setError(detail);      maximumFractionDigits: 0,

      } else if (detail?.message) {      currencyDisplay: 'narrowSymbol'

        setError(detail.message);    }).format(amount);

      } else {  };

        setError(err.response?.data?.message || 'Failed to predict price');

      }  return (

    } finally {    <Box sx={{ p: 3 }}>

      setLoading(false);      <Paper elevation={3} sx={{ p: 3 }}>

    }        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>

  };          <MoneyIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />

          <Typography variant="h4">

  const currency = prediction?.currency ?? 'INR';            House Price Prediction

  const result = prediction?.result;          </Typography>

  const breakdown = result?.breakdown ?? {};        </Box>



  const formatCurrency = (amount: number, currencyCode: string) => {        {error && (

    return new Intl.NumberFormat('en-IN', {          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>

      style: 'currency',            {error}

      currency: currencyCode,          </Alert>

      minimumFractionDigits: 0,        )}

      maximumFractionDigits: 0,

      currencyDisplay: 'narrowSymbol'        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>

    }).format(amount);          {/* Input Form */}

  };          <Box sx={{ flex: 1 }}>

            <Typography variant="h6" gutterBottom>

  const getSafeNumber = (value?: number | null): number => {              Property Details

    return typeof value === 'number' && !Number.isNaN(value) ? value : 0;            </Typography>

  };

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

  const getContributionColor = (value: number) => (value >= 0 ? 'success.main' : 'error.main');              <TextField

                fullWidth

  const formatSignedCurrency = (value: number) => {                label="Total Area (sq ft)"

    if (value === 0) {                type="number"

      return formatCurrency(0, currency);                value={formData.area}

    }                onChange={(e) => handleInputChange('area', Number(e.target.value))}

    const sign = value >= 0 ? '+' : '-';                inputProps={{ min: 100, max: 10000 }}

    return `${sign}${formatCurrency(Math.abs(value), currency)}`;              />

  };

              <Box sx={{ display: 'flex', gap: 2 }}>

  const renderContributionRow = (                <TextField

    label: string,                  fullWidth

    rawValue?: number | null,                  label="Bedrooms"

    options: { showWhenZero?: boolean } = {}                  type="number"

  ) => {                  value={formData.bedrooms}

    const value = getSafeNumber(rawValue);                  onChange={(e) => handleInputChange('bedrooms', Number(e.target.value))}

    if (!options.showWhenZero && value === 0) {                  inputProps={{ min: 1, max: 10 }}

      return null;                />

    }

                <TextField

    return (                  fullWidth

      <Box sx={{ mb: 1 }}>                  label="Bathrooms"

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>                  type="number"

          <Typography variant="body2">{label}</Typography>                  value={formData.bathrooms}

          <Typography variant="body2" color={getContributionColor(value)}>                  onChange={(e) => handleInputChange('bathrooms', Number(e.target.value))}

            {formatSignedCurrency(value)}                  inputProps={{ min: 1, max: 10 }}

          </Typography>                />

        </Box>              </Box>

      </Box>

    );              <TextField

  };                fullWidth

                label="Property Age (years)"

  return (                type="number"

    <Box sx={{ p: 3 }}>                value={formData.age}

      <Paper elevation={3} sx={{ p: 3 }}>                onChange={(e) => handleInputChange('age', Number(e.target.value))}

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>                inputProps={{ min: 0, max: 100 }}

          <MoneyIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />              />

          <Typography variant="h4">House Price Prediction</Typography>

        </Box>              <FormControl fullWidth>

                <InputLabel>Location Type</InputLabel>

        {error && (                <Select

          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>                  value={formData.location}

            {error}                  label="Location Type"

          </Alert>                  onChange={(e) => handleInputChange('location', e.target.value)}

        )}                >

                  <MenuItem value="urban">Urban</MenuItem>

        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>                  <MenuItem value="suburban">Suburban</MenuItem>

          <Box sx={{ flex: 1 }}>                  <MenuItem value="rural">Rural</MenuItem>

            <Typography variant="h6" gutterBottom>                </Select>

              Property Details              </FormControl>

            </Typography>

              <FormControl fullWidth>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>                <InputLabel>Condition</InputLabel>

              <TextField                <Select

                fullWidth                  value={formData.condition}

                label="Total Area (sq ft)"                  label="Condition"

                type="number"                  onChange={(e) => handleInputChange('condition', e.target.value)}

                value={formData.area}                >

                onChange={(e) => handleInputChange('area', Number(e.target.value))}                  <MenuItem value="excellent">Excellent</MenuItem>

                inputProps={{ min: 100, max: 20000 }}                  <MenuItem value="good">Good</MenuItem>

              />                  <MenuItem value="fair">Fair</MenuItem>

                  <MenuItem value="poor">Poor</MenuItem>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>                </Select>

                <TextField              </FormControl>

                  label="Bedrooms"

                  type="number"              <Box>

                  value={formData.bedrooms}                <Typography variant="subtitle1" gutterBottom>

                  onChange={(e) => handleInputChange('bedrooms', Number(e.target.value))}                  Amenities

                  inputProps={{ min: 0, max: 10 }}                </Typography>

                  sx={{ flex: 1, minWidth: 120 }}                {AMENITIES.map((amenity) => (

                />                  <FormControlLabel

                <TextField                    key={amenity}

                  label="Bathrooms"                    control={

                  type="number"                      <Checkbox

                  value={formData.bathrooms}                        checked={formData.amenities.includes(amenity)}

                  onChange={(e) => handleInputChange('bathrooms', Number(e.target.value))}                        onChange={() => toggleAmenity(amenity)}

                  inputProps={{ min: 0, max: 10 }}                      />

                  sx={{ flex: 1, minWidth: 120 }}                    }

                />                    label={amenity.charAt(0).toUpperCase() + amenity.slice(1)}

                <TextField                  />

                  label="Floors"                ))}

                  type="number"              </Box>

                  value={formData.floors}            </Box>

                  onChange={(e) => handleInputChange('floors', Number(e.target.value))}

                  inputProps={{ min: 1, max: 5 }}            <Button

                  sx={{ flex: 1, minWidth: 120 }}              variant="contained"

                />              size="large"

              </Box>              fullWidth

              sx={{ mt: 3 }}

              <TextField              onClick={predictPrice}

                fullWidth              disabled={loading}

                label="Property Age (years)"            >

                type="number"              {loading ? 'Calculating...' : 'Predict Price'}

                value={formData.age}            </Button>

                onChange={(e) => handleInputChange('age', Number(e.target.value))}          </Box>

                inputProps={{ min: 0, max: 100 }}

              />          {/* Results */}

          <Box sx={{ flex: 1 }}>

              <FormControl fullWidth>            {prediction ? (

                <InputLabel>Location Type</InputLabel>              <>

                <Select                <Typography variant="h6" gutterBottom>

                  value={formData.location}                  Price Estimate

                  label="Location Type"                </Typography>

                  onChange={(e) => handleInputChange('location', e.target.value)}

                >                <Card sx={{ mb: 2, bgcolor: 'primary.light', color: 'white' }}>

                  <MenuItem value="urban">Urban</MenuItem>                  <CardContent>

                  <MenuItem value="suburban">Suburban</MenuItem>                    <Typography variant="h3" align="center" gutterBottom>

                  <MenuItem value="rural">Rural</MenuItem>                      {formatCurrency(prediction.estimatedPrice)}

                </Select>                    </Typography>

              </FormControl>                    <Typography variant="body1" align="center">

                      Estimated Market Value

              <FormControl fullWidth>                    </Typography>

                <InputLabel>Condition</InputLabel>                    <Divider sx={{ my: 2, bgcolor: 'white', opacity: 0.3 }} />

                <Select                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>

                  value={formData.condition}                      <Box>

                  label="Condition"                        <Typography variant="body2">Low Estimate</Typography>

                  onChange={(e) => handleInputChange('condition', e.target.value)}                        <Typography variant="h6">

                >                          {formatCurrency(prediction.priceRange.min)}

                  <MenuItem value="excellent">Excellent</MenuItem>                        </Typography>

                  <MenuItem value="good">Good</MenuItem>                      </Box>

                  <MenuItem value="fair">Fair</MenuItem>                      <Box sx={{ textAlign: 'right' }}>

                  <MenuItem value="poor">Poor</MenuItem>                        <Typography variant="body2">High Estimate</Typography>

                </Select>                        <Typography variant="h6">

              </FormControl>                          {formatCurrency(prediction.priceRange.max)}

                        </Typography>

              <Box>                      </Box>

                <Typography variant="subtitle1" gutterBottom>                    </Box>

                  Amenities                    <Box sx={{ mt: 2, textAlign: 'center' }}>

                </Typography>                      <Chip

                {AMENITIES.map((amenity) => (                        label={`${(prediction.confidence * 100).toFixed(0)}% Confidence`}

                  <FormControlLabel                        sx={{ bgcolor: 'white', color: 'primary.main' }}

                    key={amenity}                      />

                    control={                    </Box>

                      <Checkbox                  </CardContent>

                        checked={formData.amenities.includes(amenity)}                </Card>

                        onChange={() => toggleAmenity(amenity)}

                      />                <Card>

                    }                  <CardContent>

                    label={amenity.charAt(0).toUpperCase() + amenity.slice(1)}                    <Typography variant="h6" gutterBottom>

                  />                      Price Breakdown

                ))}                    </Typography>

              </Box>

            </Box>                    <Box sx={{ mb: 1 }}>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>

            <Button                        <Typography variant="body2">Base Price</Typography>

              variant="contained"                        <Typography variant="body2">

              size="large"                          {formatCurrency(prediction.breakdown.basePrice)}

              fullWidth                        </Typography>

              sx={{ mt: 3 }}                      </Box>

              onClick={predictPrice}                    </Box>

              disabled={loading}

            >                    <Box sx={{ mb: 1 }}>

              {loading ? 'Calculating...' : 'Predict Price'}                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>

            </Button>                        <Typography variant="body2">Area ({formData.area} sq ft)</Typography>

          </Box>                        <Typography variant="body2" color="success.main">

                          +{formatCurrency(prediction.breakdown.areaContribution)}

          <Box sx={{ flex: 1 }}>                        </Typography>

            {prediction && result ? (                      </Box>

              <>                    </Box>

                <Typography variant="h6" gutterBottom>

                  Price Estimate                    <Box sx={{ mb: 1 }}>

                </Typography>                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>

                        <Typography variant="body2">Bedrooms ({formData.bedrooms})</Typography>

                <Card sx={{ mb: 2, bgcolor: 'primary.light', color: 'white' }}>                        <Typography variant="body2" color="success.main">

                  <CardContent>                          +{formatCurrency(prediction.breakdown.bedroomContribution)}

                    <Typography variant="h3" align="center" gutterBottom>                        </Typography>

                      {formatCurrency(result.estimatedPrice, currency)}                      </Box>

                    </Typography>                    </Box>

                    <Typography variant="body1" align="center">

                      Estimated Market Value                    <Box sx={{ mb: 1 }}>

                    </Typography>                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>

                    <Divider sx={{ my: 2, bgcolor: 'white', opacity: 0.3 }} />                        <Typography variant="body2">Bathrooms ({formData.bathrooms})</Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>                        <Typography variant="body2" color="success.main">

                      <Box>                          +{formatCurrency(prediction.breakdown.bathroomContribution)}

                        <Typography variant="body2">Low Estimate</Typography>                        </Typography>

                        <Typography variant="h6">                      </Box>

                          {formatCurrency(result.priceRange.min, currency)}                    </Box>

                        </Typography>

                      </Box>                    <Box sx={{ mb: 1 }}>

                      <Box sx={{ textAlign: 'right' }}>                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>

                        <Typography variant="body2">High Estimate</Typography>                        <Typography variant="body2">Location Premium</Typography>

                        <Typography variant="h6">                        <Typography variant="body2" color="success.main">

                          {formatCurrency(result.priceRange.max, currency)}                          +{formatCurrency(prediction.breakdown.locationPremium)}

                        </Typography>                        </Typography>

                      </Box>                      </Box>

                    </Box>                    </Box>

                    <Box sx={{ mt: 2, textAlign: 'center' }}>

                      <Chip                    <Box sx={{ mb: 1 }}>

                        label={`${(result.confidence * 100).toFixed(0)}% Confidence`}                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>

                        sx={{ bgcolor: 'white', color: 'primary.main' }}                        <Typography variant="body2">Condition Adjustment</Typography>

                      />                        <Typography

                    </Box>                          variant="body2"

                    <Typography variant="body2" align="center" sx={{ mt: 2 }}>                          color={prediction.breakdown.conditionAdjustment >= 0 ? 'success.main' : 'error.main'}

                      Model used: {prediction.modelUsed.toUpperCase()}                        >

                    </Typography>                          {prediction.breakdown.conditionAdjustment >= 0 ? '+' : ''}

                    <Typography variant="caption" align="center" display="block">                          {formatCurrency(prediction.breakdown.conditionAdjustment)}

                      Generated {new Date(prediction.timestamp).toLocaleString()}                        </Typography>

                    </Typography>                      </Box>

                  </CardContent>                    </Box>

                </Card>

                    <Box sx={{ mb: 1 }}>

                <Card>                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>

                  <CardContent>                        <Typography variant="body2">Age Depreciation</Typography>

                    <Typography variant="h6" gutterBottom>                        <Typography variant="body2" color="error.main">

                      Price Breakdown                          {formatCurrency(prediction.breakdown.ageAdjustment)}

                    </Typography>                        </Typography>

                      </Box>

                    <Box sx={{ mb: 1 }}>                    </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>

                        <Typography variant="body2">Base Price</Typography>                    {formData.amenities.length > 0 && (

                        <Typography variant="body2">                      <Box sx={{ mt: 2 }}>

                          {formatCurrency(getSafeNumber(breakdown.basePrice), currency)}                        <Typography variant="body2" gutterBottom>

                        </Typography>                          Amenities Included:

                      </Box>                        </Typography>

                    </Box>                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>

                          {formData.amenities.map((amenity) => (

                    {renderContributionRow(`Area (${formData.area} sq ft)`, breakdown.areaContribution)}                            <Chip key={amenity} label={amenity} size="small" color="primary" />

                    {renderContributionRow(`Bedrooms (${formData.bedrooms})`, breakdown.bedroomContribution)}                          ))}

                    {renderContributionRow(`Bathrooms (${formData.bathrooms})`, breakdown.bathroomContribution)}                        </Box>

                    {renderContributionRow(`Floors (${formData.floors})`, breakdown.floorsContribution)}                      </Box>

                    {renderContributionRow('Location Premium', breakdown.locationPremium)}                    )}

                    {renderContributionRow('Condition Adjustment', breakdown.conditionAdjustment, { showWhenZero: true })}                  </CardContent>

                    {renderContributionRow('Garage Impact', breakdown.garageContribution)}                </Card>

                    {renderContributionRow('Amenities Impact', breakdown.otherAmenitiesContribution)}              </>

                    {renderContributionRow('Age Adjustment', breakdown.ageAdjustment, { showWhenZero: true })}            ) : (

              <Box

                    {formData.amenities.length > 0 && (                sx={{

                      <Box sx={{ mt: 2 }}>                  height: '100%',

                        <Typography variant="body2" gutterBottom>                  display: 'flex',

                          Amenities Included:                  alignItems: 'center',

                        </Typography>                  justifyContent: 'center',

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>                  flexDirection: 'column',

                          {formData.amenities.map((amenity) => (                  color: 'text.secondary'

                            <Chip key={amenity} label={amenity} size="small" color="primary" />                }}

                          ))}              >

                        </Box>                <TrendIcon sx={{ fontSize: 100, mb: 2, opacity: 0.3 }} />

                      </Box>                <Typography variant="h6">

                    )}                  Enter property details to get price estimate

                  </CardContent>                </Typography>

                </Card>              </Box>

              </>            )}

            ) : (          </Box>

              <Box        </Box>

                sx={{      </Paper>

                  height: '100%',    </Box>

                  display: 'flex',  );

                  alignItems: 'center',};

                  justifyContent: 'center',

                  flexDirection: 'column',export default PricePrediction;

                  color: 'text.secondary'
                }}
              >
                <TrendIcon sx={{ fontSize: 100, mb: 2, opacity: 0.3 }} />
                <Typography variant="h6" align="center">
                  Enter property details to get a price estimate.
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
