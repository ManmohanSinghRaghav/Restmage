const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'admin'],
      default: 'viewer'
    }
  }],
  // Property details
  propertyDetails: {
    type: {
      type: String,
      enum: ['residential', 'commercial', 'industrial', 'mixed-use'],
      required: true
    },
    location: {
      address: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    dimensions: {
      length: {
        type: Number,
        required: true,
        min: 0
      },
      width: {
        type: Number,
        required: true,
        min: 0
      },
      height: {
        type: Number,
        required: true,
        min: 0
      },
      unit: {
        type: String,
        enum: ['feet', 'meters'],
        default: 'feet'
      }
    },
    materials: [{
      type: {
        type: String,
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 0
      },
      unit: String,
      pricePerUnit: {
        type: Number,
        min: 0
      }
    }]
  },
  // References to active floor plan and cost estimate
  activeFloorPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FloorPlan'
  },
  activeCostEstimate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CostEstimate'
  },
  activePricePrediction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PricePrediction'
  },
  status: {
    type: String,
    enum: ['draft', 'in-progress', 'completed', 'archived'],
    default: 'draft'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  version: {
    type: Number,
    default: 1
  }
}, {
  timestamps: true
});

// Index for geospatial queries
projectSchema.index({ 'propertyDetails.location.coordinates': '2dsphere' });

// Index for text search
projectSchema.index({ 
  name: 'text', 
  description: 'text', 
  'propertyDetails.location.address': 'text',
  'propertyDetails.location.city': 'text'
});

// Virtual populate for floor plans
projectSchema.virtual('floorPlans', {
  ref: 'FloorPlan',
  localField: '_id',
  foreignField: 'project'
});

// Virtual populate for cost estimates
projectSchema.virtual('costEstimates', {
  ref: 'CostEstimate',
  localField: '_id',
  foreignField: 'project'
});

// Virtual populate for price predictions
projectSchema.virtual('pricePredictions', {
  ref: 'PricePrediction',
  localField: '_id',
  foreignField: 'project'
});

// Ensure virtuals are included in JSON output
projectSchema.set('toJSON', { virtuals: true });
projectSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Project', projectSchema);