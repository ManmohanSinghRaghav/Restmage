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
  // Map/Floorplan data
  mapData: {
    bounds: {
      type: [[Number]], // Array of coordinate pairs defining bounds
      default: []
    },
    layers: [{
      id: String,
      name: String,
      type: {
        type: String,
        enum: ['marker', 'polygon', 'line', 'circle']
      },
      data: mongoose.Schema.Types.Mixed,
      style: mongoose.Schema.Types.Mixed,
      visible: {
        type: Boolean,
        default: true
      }
    }],
    center: {
      lat: {
        type: Number,
        default: 40.7128
      },
      lng: {
        type: Number,
        default: -74.0060
      }
    },
    zoom: {
      type: Number,
      default: 13
    }
  },
  // Cost estimation
  costEstimation: {
    materials: {
      type: Number,
      default: 0
    },
    labor: {
      type: Number,
      default: 0
    },
    permits: {
      type: Number,
      default: 0
    },
    equipment: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'USD'
    },
    lastCalculated: Date,
    breakdown: [{
      category: String,
      item: String,
      quantity: Number,
      unitCost: Number,
      totalCost: Number
    }]
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

module.exports = mongoose.model('Project', projectSchema);