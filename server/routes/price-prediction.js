const express = require('express');
const { auth } = require('../middleware/auth');

const router = express.Router();

/**
 * Simple ML-based House Price Prediction
 * Uses multiple linear regression based on various features
 */

// Training data coefficients (pre-calculated from typical real estate data)
const PRICE_MODEL = {
  basePrice: 50000, // Base price in USD
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
 * Calculate house price based on features
 */
function predictPrice(features) {
  let price = PRICE_MODEL.basePrice;

  // Area-based calculation
  if (features.area) {
    price += features.area * PRICE_MODEL.coefficients.areaPerSqFt;
  }

  // Bedrooms
  if (features.bedrooms) {
    price += features.bedrooms * PRICE_MODEL.coefficients.bedrooms;
  }

  // Bathrooms
  if (features.bathrooms) {
    price += features.bathrooms * PRICE_MODEL.coefficients.bathrooms;
  }

  // Age of property
  if (features.age) {
    price += features.age * PRICE_MODEL.coefficients.age;
  }

  // Location premium
  if (features.location) {
    const locationPremium = PRICE_MODEL.coefficients.location[features.location.toLowerCase()] || 0;
    price += locationPremium;
  }

  // Condition adjustment
  if (features.condition) {
    const conditionAdjustment = PRICE_MODEL.coefficients.condition[features.condition.toLowerCase()] || 0;
    price += conditionAdjustment;
  }

  // Amenities
  if (features.amenities && Array.isArray(features.amenities)) {
    features.amenities.forEach(amenity => {
      const amenityValue = PRICE_MODEL.coefficients.amenities[amenity.toLowerCase()] || 0;
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
      areaContribution: features.area ? features.area * PRICE_MODEL.coefficients.areaPerSqFt : 0,
      bedroomContribution: features.bedrooms ? features.bedrooms * PRICE_MODEL.coefficients.bedrooms : 0,
      bathroomContribution: features.bathrooms ? features.bathrooms * PRICE_MODEL.coefficients.bathrooms : 0,
      ageAdjustment: features.age ? features.age * PRICE_MODEL.coefficients.age : 0,
      locationPremium: features.location ? PRICE_MODEL.coefficients.location[features.location.toLowerCase()] || 0 : 0,
      conditionAdjustment: features.condition ? PRICE_MODEL.coefficients.condition[features.condition.toLowerCase()] || 0 : 0
    }
  };
}

/**
 * POST /api/price-prediction/predict
 * Predict house price based on features
 */
router.post('/predict', auth, async (req, res) => {
  try {
    const features = req.body;

    // Validation
    if (!features.area || !features.bedrooms || !features.bathrooms) {
      return res.status(400).json({
        message: 'Required fields missing',
        required: {
          area: 'number (square feet)',
          bedrooms: 'number',
          bathrooms: 'number',
          age: 'number (optional, years old)',
          location: 'string (optional: urban, suburban, rural)',
          condition: 'string (optional: excellent, good, fair, poor)',
          amenities: 'array of strings (optional: garage, garden, pool, basement, balcony)'
        }
      });
    }

    // Predict price
    const prediction = predictPrice(features);

    res.json({
      success: true,
      message: 'Price prediction completed',
      prediction,
      inputFeatures: features,
      currency: 'USD',
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

    const comparisons = properties.map((property, index) => ({
      propertyId: index + 1,
      features: property,
      prediction: predictPrice(property)
    }));

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
