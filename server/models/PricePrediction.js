const mongoose = require('mongoose');

const pricePredictionSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    index: true
  },
  version: {
    type: Number,
    default: 1
  },
  name: {
    type: String,
    trim: true
  },
  inputFeatures: {
    area: Number,
    bedrooms: Number,
    bathrooms: Number,
    stories: Number,
    mainroad: String,
    guestroom: String,
    basement: String,
    hotwaterheating: String,
    airconditioning: String,
    parking: Number,
    prefarea: String,
    furnishingstatus: String,
    location: String,
    condition: String,
    amenities: [String]
  },
  estimatedPrice: {
    type: Number,
    required: true
  },
  priceRange: {
    min: Number,
    max: Number
  },
  confidence: {
    type: Number
  },
  breakdown: {
    type: mongoose.Schema.Types.Mixed
  },
  currency: {
    type: String,
    default: 'USD'
  },
  predictionMethod: {
    type: String,
    enum: ['heuristic', 'ml'],
    default: 'heuristic'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Ensure only one active prediction per project if needed, or just index for queries
pricePredictionSchema.index({ project: 1, isActive: 1 });

module.exports = mongoose.model('PricePrediction', pricePredictionSchema);
