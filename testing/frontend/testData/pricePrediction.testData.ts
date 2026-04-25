/**
 * Frontend Integration Test Data for ML Price Prediction
 * Use this to test the PricePrediction component
 */

export const testCases = [
  {
    name: 'Luxury Downtown Property',
    input: {
      area: 2500,
      bedrooms: 5,
      bathrooms: 4,
      age: 0,
      location: 'Downtown',
      condition: 'Excellent',
      amenities: ['garage', 'pool', 'balcony']
    },
    expectedRange: { min: 400000, max: 900000 }
  },
  {
    name: 'Mid-range Suburban Home',
    input: {
      area: 1500,
      bedrooms: 3,
      bathrooms: 2,
      age: 5,
      location: 'Suburban',
      condition: 'Good',
      amenities: ['garage']
    },
    expectedRange: { min: 500000, max: 700000 }
  },
  {
    name: 'Budget Rural Property',
    input: {
      area: 800,
      bedrooms: 2,
      bathrooms: 1,
      age: 20,
      location: 'Rural',
      condition: 'Fair',
      amenities: []
    },
    expectedRange: { min: 200000, max: 500000 }
  },
  {
    name: 'Urban Apartment',
    input: {
      area: 1200,
      bedrooms: 2,
      bathrooms: 2,
      age: 3,
      location: 'Urban',
      condition: 'Excellent',
      amenities: ['balcony']
    },
    expectedRange: { min: 400000, max: 700000 }
  },
  {
    name: 'Large Family Home',
    input: {
      area: 3000,
      bedrooms: 4,
      bathrooms: 3,
      age: 8,
      location: 'Suburban',
      condition: 'Good',
      amenities: ['garage', 'garden', 'basement']
    },
    expectedRange: { min: 600000, max: 900000 }
  }
];

/**
 * Validation Functions
 */

export const validateInput = (formData: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Required numeric fields
  if (!formData.area || formData.area < 100 || formData.area > 10000) {
    errors.push('Area must be between 100 and 10000 sq ft');
  }

  if (!formData.bedrooms || formData.bedrooms < 1 || formData.bedrooms > 10) {
    errors.push('Bedrooms must be between 1 and 10');
  }

  if (!formData.bathrooms || formData.bathrooms < 1 || formData.bathrooms > 10) {
    errors.push('Bathrooms must be between 1 and 10');
  }

  if (formData.age === undefined || formData.age < 0 || formData.age > 100) {
    errors.push('Age must be between 0 and 100 years');
  }

  // Required categorical fields
  const validLocations = ['Downtown', 'Urban', 'Suburban', 'Rural'];
  if (!formData.location || !validLocations.includes(formData.location)) {
    errors.push(`Location must be one of: ${validLocations.join(', ')}`);
  }

  const validConditions = ['Excellent', 'Good', 'Fair', 'Poor'];
  if (!formData.condition || !validConditions.includes(formData.condition)) {
    errors.push(`Condition must be one of: ${validConditions.join(', ')}`);
  }

  // Amenities validation
  const validAmenities = ['garage', 'garden', 'pool', 'basement', 'balcony'];
  if (formData.amenities && Array.isArray(formData.amenities)) {
    const invalidAmenities = formData.amenities.filter((a: string) => !validAmenities.includes(a));
    if (invalidAmenities.length > 0) {
      errors.push(`Invalid amenities: ${invalidAmenities.join(', ')}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

export const validateResponse = (response: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!response.prediction) {
    errors.push('Response missing prediction object');
    return { valid: false, errors };
  }

  const pred = response.prediction;

  // Check required fields
  if (typeof pred.estimatedPrice !== 'number' || pred.estimatedPrice <= 0) {
    errors.push('Invalid estimatedPrice');
  }

  if (!pred.priceRange || typeof pred.priceRange.min !== 'number' || typeof pred.priceRange.max !== 'number') {
    errors.push('Invalid priceRange');
  }

  if (typeof pred.confidence !== 'number' || pred.confidence < 0 || pred.confidence > 1) {
    errors.push('Invalid confidence (must be between 0 and 1)');
  }

  if (!pred.breakdown) {
    errors.push('Missing breakdown object');
  } else {
    const requiredBreakdownFields = [
      'basePrice', 'areaContribution', 'bedroomContribution', 
      'bathroomContribution', 'ageAdjustment', 'locationPremium', 
      'conditionAdjustment'
    ];
    
    for (const field of requiredBreakdownFields) {
      if (typeof pred.breakdown[field] !== 'number') {
        errors.push(`Missing or invalid breakdown.${field}`);
      }
    }
  }

  // Logical validation
  if (pred.priceRange && pred.priceRange.min > pred.priceRange.max) {
    errors.push('Price range min is greater than max');
  }

  if (pred.estimatedPrice && pred.priceRange) {
    if (pred.estimatedPrice < pred.priceRange.min || pred.estimatedPrice > pred.priceRange.max) {
      errors.push('Estimated price is outside the price range');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Mock API Response for Testing
 */
export const mockSuccessResponse = {
  success: true,
  message: 'Prediction completed',
  prediction: {
    estimatedPrice: 663142,
    priceRange: {
      min: 629885,
      max: 696400
    },
    confidence: 0.92,
    breakdown: {
      basePrice: 50000,
      areaContribution: 150000,
      bedroomContribution: 45000,
      bathroomContribution: 20000,
      ageAdjustment: -10000,
      locationPremium: 30000,
      conditionAdjustment: 20000
    }
  },
  input: {
    area: 1500,
    bedrooms: 3,
    bathrooms: 2,
    age: 5,
    location: 'Suburban',
    condition: 'Good',
    amenities: []
  }
};

export const mockErrorResponse = {
  success: false,
  message: 'Python prediction failed',
  detail: 'Model file not found'
};

/**
 * Usage Instructions:
 * 
 * 1. Import test cases in your test file:
 *    import { testCases, validateInput, validateResponse } from './testData';
 * 
 * 2. Use validation functions:
 *    const result = validateInput(formData);
 *    if (!result.valid) {
 *      console.error('Validation errors:', result.errors);
 *    }
 * 
 * 3. Run test cases:
 *    testCases.forEach(testCase => {
 *      const response = await api.post('/price-prediction/ml-predict', testCase.input);
 *      const validation = validateResponse(response.data);
 *      // Assert validation.valid === true
 *    });
 */
