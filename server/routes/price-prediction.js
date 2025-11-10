const express = require('express');
const { auth } = require('../middleware/auth');
const { spawnSync } = require('child_process');
const path = require('path');

const router = express.Router();

 

// Training data coefficients (pre-calculated from typical real estate data)
const PRICE_MODEL = {
  basePrice: 50000, // Base price (treated as INR now)
  coefficients: {
    areaPerSqFt: 100, // Price per square foot
    bedrooms: 15000, // Additional price per bedroom
    bathrooms: 10000, // Additional price per bathroom
    age: -2000, // Price reduction per year of age
    location: {
      urban: 50000,
      suburban: 30000,
      rural: 10000
    },
    condition: {
      excellent: 40000,
      good: 20000,
      fair: 0,
      poor: -20000
    },
    amenities: {
      garage: 15000,
      garden: 10000,
      pool: 25000,
      basement: 20000,
      balcony: 8000
    }
  }
};

/**
 * Calculate house price based on features.
 *
 * This function now expects features more in line with the dataset:
 * - area (sq ft)
 * - bedrooms
 * - bathrooms
 * - floors
 * - yearBuilt (or age)
 * - location
 * - condition
 * - garage ("Yes"/"No" or boolean) or amenities array including 'garage'
 */
function predictPrice(features) {
  let price = PRICE_MODEL.basePrice;

  const currentYear = new Date().getFullYear();

  // Area-based calculation
  const area = features.area || features.Area || 0;
  price += area * PRICE_MODEL.coefficients.areaPerSqFt;

  // Bedrooms
  const bedrooms = features.bedrooms || features.Bedrooms || 0;
  price += bedrooms * PRICE_MODEL.coefficients.bedrooms;

  // Bathrooms
  const bathrooms = features.bathrooms || features.Bathrooms || 0;
  price += bathrooms * PRICE_MODEL.coefficients.bathrooms;

  // Floors (small premium per extra floor)
  const floors = features.floors || features.Floors || 1;
  // We'll add a small contribution per floor (e.g., 0.5 * per-bedroom coefficient)
  price += (floors - 1) * (PRICE_MODEL.coefficients.bedrooms * 0.5);

  // Determine age from yearBuilt if provided, otherwise use provided age
  let age = 0;
  if (features.yearBuilt || features.YearBuilt) {
    age = currentYear - (features.yearBuilt || features.YearBuilt);
  } else if (typeof features.age !== 'undefined') {
    age = features.age;
  }
  price += age * PRICE_MODEL.coefficients.age;

  // Location premium
  if (features.location || features.Location) {
    const locKey = (features.location || features.Location).toString().toLowerCase();
    const locationPremium = PRICE_MODEL.coefficients.location[locKey] || 0;
    price += locationPremium;
  }

  // Condition adjustment
  if (features.condition || features.Condition) {
    const condKey = (features.condition || features.Condition).toString().toLowerCase();
    const conditionAdjustment = PRICE_MODEL.coefficients.condition[condKey] || 0;
    price += conditionAdjustment;
  }

  // Garage - check explicit field, boolean, or amenities list
  let hasGarage = false;
  if (typeof features.garage !== 'undefined') {
    const g = features.garage;
    if (typeof g === 'boolean') hasGarage = g;
    else if (typeof g === 'string') hasGarage = g.toLowerCase() === 'yes' || g.toLowerCase() === 'true';
  }
  if (!hasGarage && features.amenities && Array.isArray(features.amenities)) {
    hasGarage = features.amenities.map(a => a.toString().toLowerCase()).includes('garage');
  }
  if (hasGarage) {
    price += PRICE_MODEL.coefficients.amenities.garage;
  }

  // Also apply other amenities if supplied
  if (features.amenities && Array.isArray(features.amenities)) {
    features.amenities.forEach(amenity => {
      const amenityValue = PRICE_MODEL.coefficients.amenities[amenity.toLowerCase()] || 0;
      // avoid double counting garage
      if (amenity.toLowerCase() === 'garage') return;
      price += amenityValue;
    });
  }

  // Add market variance (±10% random variation to simulate market conditions)
  const marketVariance = price * 0.1;
  const minPrice = Math.max(0, price - marketVariance);
  const maxPrice = price + marketVariance;

  return {
    estimatedPrice: Math.round(price),
    priceRange: {
      min: Math.round(minPrice),
      max: Math.round(maxPrice)
    },
    confidence: 0.85, // 85% confidence level
    breakdown: {
      basePrice: PRICE_MODEL.basePrice,
      areaContribution: Math.round(area * PRICE_MODEL.coefficients.areaPerSqFt),
      bedroomContribution: Math.round(bedrooms * PRICE_MODEL.coefficients.bedrooms),
      bathroomContribution: Math.round(bathrooms * PRICE_MODEL.coefficients.bathrooms),
      floorsContribution: Math.round((floors - 1) * (PRICE_MODEL.coefficients.bedrooms * 0.5)),
      ageAdjustment: Math.round(age * PRICE_MODEL.coefficients.age),
      locationPremium: features.location || features.Location ? (PRICE_MODEL.coefficients.location[(features.location || features.Location).toString().toLowerCase()] || 0) : 0,
      conditionAdjustment: features.condition || features.Condition ? (PRICE_MODEL.coefficients.condition[(features.condition || features.Condition).toString().toLowerCase()] || 0) : 0,
      garageContribution: hasGarage ? PRICE_MODEL.coefficients.amenities.garage : 0
    }
  };
}

/**
 * POST /api/price-prediction/predict
 * Predict house price based on features
 */
router.post('/predict', auth, async (req, res) => {
  try {
    const raw = req.body || {};
    const currentYear = new Date().getFullYear();

    // Normalize inputs: accept dataset keys or legacy UI keys
    const normalized = {
      area: raw.area || raw.Area || 0,
      bedrooms: raw.bedrooms || raw.Bedrooms || 0,
      bathrooms: raw.bathrooms || raw.Bathrooms || 0,
      floors: raw.floors || raw.Floors || raw.floors === 0 ? raw.floors : (raw.Floors || 1),
      yearBuilt: raw.yearBuilt || raw.YearBuilt || (typeof raw.age !== 'undefined' ? currentYear - raw.age : undefined),
      location: raw.location || raw.Location,
      condition: raw.condition || raw.Condition,
      garage: typeof raw.garage !== 'undefined' ? raw.garage : (raw.Garage || undefined),
      amenities: raw.amenities || []
    };

    // Validation: require core numeric fields (area, bedrooms, bathrooms, floors, yearBuilt)
    const missing = [];
    if (!normalized.area) missing.push('area');
    if (!normalized.bedrooms && normalized.bedrooms !== 0) missing.push('bedrooms');
    if (!normalized.bathrooms && normalized.bathrooms !== 0) missing.push('bathrooms');
    if (!normalized.floors && normalized.floors !== 0) missing.push('floors');
    if (typeof normalized.yearBuilt === 'undefined' || normalized.yearBuilt === null) missing.push('yearBuilt (or age)');

    if (missing.length > 0) {
      return res.status(400).json({
        message: 'Required fields missing',
        missing,
        required: {
          area: 'number (square feet)',
          bedrooms: 'number',
          bathrooms: 'number',
          floors: 'number',
          yearBuilt: 'number (year) OR age: number (years)',
          location: 'string (optional: Urban, Suburban, Rural)',
          condition: 'string (optional: Excellent, Good, Fair, Poor)',
          garage: 'string or boolean (optional) OR include "garage" in amenities array'
        }
      });
    }

    // If garage not provided explicitly but amenities contains garage, set it
    if (typeof normalized.garage === 'undefined' && Array.isArray(normalized.amenities)) {
      const hasGarage = normalized.amenities.map(a => a.toString().toLowerCase()).includes('garage');
      normalized.garage = hasGarage ? 'Yes' : 'No';
    }

    // Try to use Python ML model if available (model.pkl + encoder.pkl)
    // If that fails, fallback to the built-in JS heuristic model (predictPrice)
    let usedModel = 'js_fallback';
    let prediction;

    try {
      const predictorPath = path.join(__dirname, '..', 'ml_predictor.py');
      const payload = JSON.stringify({ features: normalized });
      const py = spawnSync(process.env.PYTHON || 'python', [predictorPath], {
        input: payload,
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024
      });

      if (py.error) throw py.error;

      if (py.status === 0 && py.stdout) {
        try {
          const out = JSON.parse(py.stdout);
          if (out && out.success && Array.isArray(out.predictions) && out.predictions.length > 0) {
            usedModel = 'python_pickle_model';
            prediction = {
              estimatedPrice: Math.round(out.predictions[0]),
              priceRange: { min: Math.round(out.predictions[0] * 0.95), max: Math.round(out.predictions[0] * 1.05) },
              confidence: out.confidence || 0.9,
              breakdown: out.breakdown || {}
            };
          } else {
            // treat as failure and fall back
            throw new Error('Python predictor returned invalid response');
          }
        } catch (err) {
          console.warn('Failed to parse python predictor output, falling back to JS model:', err && err.message);
          prediction = predictPrice(normalized);
        }
      } else {
        // python exited with error
        const errMsg = py.stderr || (py.stdout ? py.stdout : 'Unknown python error');
        console.warn('Python predictor failed:', errMsg);
        prediction = predictPrice(normalized);
      }
    } catch (err) {
      console.warn('Error running python predictor, falling back to JS model:', err && err.message);
      prediction = predictPrice(normalized);
    }

    res.json({
      success: true,
      message: 'Price prediction completed',
      prediction,
      inputFeatures: normalized,
      modelUsed: usedModel,
      currency: 'INR',
      disclaimer: 'This is an estimated price based on general market trends. Actual prices may vary based on specific location and market conditions.'
    });
  } catch (error) {
    console.error('Price prediction error:', error);
    res.status(500).json({
      message: 'Failed to predict price',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/price-prediction/compare
 * Compare prices for multiple property configurations
 */
router.post('/compare', auth, async (req, res) => {
  try {
    const { properties } = req.body;

    if (!properties || !Array.isArray(properties) || properties.length === 0) {
      return res.status(400).json({ message: 'Array of properties required for comparison' });
    }

    // Try batch prediction via Python predictor. Fall back to JS heuristic per-property if Python not available.
    let comparisons = [];
    try {
      const predictorPath = path.join(__dirname, '..', 'ml_predictor.py');
      const payload = JSON.stringify({ properties });
      const py = spawnSync(process.env.PYTHON || 'python', [predictorPath], {
        input: payload,
        encoding: 'utf8',
        maxBuffer: 20 * 1024 * 1024
      });

      if (py.error) throw py.error;

      if (py.status === 0 && py.stdout) {
        const out = JSON.parse(py.stdout);
        if (out && out.success && Array.isArray(out.predictions) && out.predictions.length === properties.length) {
          comparisons = properties.map((property, index) => ({
            propertyId: index + 1,
            features: property,
            prediction: {
              estimatedPrice: Math.round(out.predictions[index]),
              priceRange: { min: Math.round(out.predictions[index] * 0.95), max: Math.round(out.predictions[index] * 1.05) },
              confidence: out.confidence || 0.9,
              breakdown: out.breakdown && out.breakdown[index] ? out.breakdown[index] : {}
            }
          }));
        } else {
          // fallback
          comparisons = properties.map((property, index) => ({
            propertyId: index + 1,
            features: property,
            prediction: predictPrice(property)
          }));
        }
      } else {
        comparisons = properties.map((property, index) => ({
          propertyId: index + 1,
          features: property,
          prediction: predictPrice(property)
        }));
      }
    } catch (err) {
      console.warn('Batch python predictor failed, falling back to JS per-property predictions:', err && err.message);
      comparisons = properties.map((property, index) => ({
        propertyId: index + 1,
        features: property,
        prediction: predictPrice(property)
      }));
    }

    // Sort by price
    comparisons.sort((a, b) => a.prediction.estimatedPrice - b.prediction.estimatedPrice);

    res.json({
      success: true,
      message: 'Price comparison completed',
      comparisons,
      summary: {
        lowest: comparisons[0].prediction.estimatedPrice,
        highest: comparisons[comparisons.length - 1].prediction.estimatedPrice,
        average: Math.round(comparisons.reduce((sum, c) => sum + c.prediction.estimatedPrice, 0) / comparisons.length)
      }
    });
  } catch (error) {
    console.error('Price comparison error:', error);
    res.status(500).json({ message: 'Failed to compare prices' });
  }
});

/**
 * GET /api/price-prediction/market-trends
 * Get current market trends and factors
 */
router.get('/market-trends', (req, res) => {
  const trends = {
    currentYear: new Date().getFullYear(),
    averagePricePerSqFt: PRICE_MODEL.coefficients.areaPerSqFt,
    popularAmenities: [
      { name: 'Pool', priceImpact: PRICE_MODEL.coefficients.amenities.pool },
      { name: 'Garage', priceImpact: PRICE_MODEL.coefficients.amenities.garage },
      { name: 'Basement', priceImpact: PRICE_MODEL.coefficients.amenities.basement },
      { name: 'Garden', priceImpact: PRICE_MODEL.coefficients.amenities.garden },
      { name: 'Balcony', priceImpact: PRICE_MODEL.coefficients.amenities.balcony }
    ],
    locationPremiums: Object.entries(PRICE_MODEL.coefficients.location).map(([type, premium]) => ({
      locationType: type,
      premium
    })),
    depreciationPerYear: Math.abs(PRICE_MODEL.coefficients.age),
    tips: [
      'Location is the most significant factor affecting property value',
      'Modern amenities can increase property value by 15-30%',
      'Properties under 10 years old command premium prices',
      'Each additional bedroom adds significant value',
      'Excellent condition properties can fetch 20-40% premium'
    ]
  };

  res.json(trends);
});

module.exports = router;
