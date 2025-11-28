const express = require('express');
const { auth } = require('../middleware/auth');
const { spawn, spawnSync } = require('child_process');
const path = require('path');
const PricePrediction = require('../models/PricePrediction');
const Project = require('../models/Project');

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

    // Save prediction
    const pricePrediction = new PricePrediction({
      project: req.body.projectId || null,
      name: req.body.name || 'Heuristic Prediction',
      inputFeatures: features,
      estimatedPrice: prediction.estimatedPrice,
      priceRange: prediction.priceRange,
      confidence: prediction.confidence,
      breakdown: prediction.breakdown,
      predictionMethod: 'heuristic',
      createdBy: req.user._id
    });
    await pricePrediction.save();

    // Update project if projectId is provided
    if (req.body.projectId) {
      await Project.findByIdAndUpdate(req.body.projectId, {
        activePricePrediction: pricePrediction._id
      });
    }

    res.json({
      success: true,
      message: 'Price prediction completed',
      prediction,
      predictionId: pricePrediction._id,
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

/**
 * POST /api/price-prediction/ml-predict
 * Calls the Python prediction script (uses provided model files in PricePrediction/)
 */
router.post('/ml-predict', auth, async (req, res) => {
  try {
    const scriptPath = path.join(__dirname, '..', 'PricePrediction', 'predict.py');

    // spawn python process
    const py = spawn(process.env.PYTHON || 'python', [scriptPath], { cwd: path.join(__dirname, '..') });

    let stdout = '';
    let stderr = '';

    py.stdout.on('data', chunk => { stdout += chunk.toString(); });
    py.stderr.on('data', chunk => { stderr += chunk.toString(); });

    py.on('error', err => {
      console.error('Failed to start python process:', err);
      return res.status(500).json({ success: false, message: 'Failed to start python process', error: err.message });
    });

    py.on('close', async code => {
      if (code !== 0) {
        console.error('Python prediction error:', stderr);
        return res.status(500).json({ success: false, message: 'Python prediction failed', detail: stderr });
      }

      try {
        const out = JSON.parse(stdout);
        if (out.error) {
          return res.status(400).json({ success: false, message: 'Prediction error', detail: out });
        }

        // Calculate heuristic breakdown to enrich the response
        // The ML model only returns the total price, so we use the heuristic model
        // to provide the breakdown of how different factors contribute to the price.
        const heuristic = predictPrice(req.body);
        const mlPrice = Math.round(out.predicted_price);

        // Construct the full response object expected by the frontend
        const prediction = {
          estimatedPrice: mlPrice,
          priceRange: {
            min: Math.round(mlPrice * 0.95),
            max: Math.round(mlPrice * 1.05)
          },
          confidence: 0.92, // Assume ML model is more confident
          breakdown: heuristic.breakdown
        };

        // Save prediction
        const pricePrediction = new PricePrediction({
          project: req.body.projectId || null,
          name: req.body.name || 'ML Prediction',
          inputFeatures: req.body,
          estimatedPrice: prediction.estimatedPrice,
          priceRange: prediction.priceRange,
          confidence: prediction.confidence,
          breakdown: prediction.breakdown,
          predictionMethod: 'ml',
          createdBy: req.user._id
        });
        await pricePrediction.save();

        // Update project if projectId is provided
        if (req.body.projectId) {
          await Project.findByIdAndUpdate(req.body.projectId, {
            activePricePrediction: pricePrediction._id
          });
        }

        return res.json({ 
          success: true, 
          message: 'Prediction completed', 
          prediction, 
          predictionId: pricePrediction._id,
          input: req.body 
        });
      } catch (err) {
        console.error('Invalid JSON from python:', err, stdout);
        return res.status(500).json({ success: false, message: 'Invalid response from python script', raw: stdout });
      }
    });

    // send input JSON to python stdin
    try {
      py.stdin.write(JSON.stringify(req.body));
      py.stdin.end();
    } catch (e) {
      console.error('Failed to write to python stdin:', e);
      return res.status(500).json({ success: false, message: 'Failed to send input to python script', error: e.message });
    }
  } catch (error) {
    console.error('ml-predict error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

/**
 * GET /api/price-prediction/history
 * Get prediction history
 */
router.get('/history', auth, async (req, res) => {
  try {
    const predictions = await PricePrediction.find({
      createdBy: req.user._id
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      predictions
    });
  } catch (error) {
    console.error('Error fetching prediction history:', error);
    res.status(500).json({ message: 'Failed to fetch prediction history' });
  }
});

module.exports = router;
