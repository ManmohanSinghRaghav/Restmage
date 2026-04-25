const mongoose = require('mongoose');

const costEstimateSchema = new mongoose.Schema({
  // Optional link to parent project
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    index: true
  },
  
  // Version control
  version: {
    type: Number,
    default: 1,
    min: 1
  },
  
  // Estimate name/title
  name: {
    type: String,
    trim: true,
    maxlength: 200
  },
  
  // Cost breakdown
  materials: {
    type: Number,
    default: 0,
    min: 0
  },
  
  labor: {
    type: Number,
    default: 0,
    min: 0
  },
  
  permits: {
    type: Number,
    default: 0,
    min: 0
  },
  
  equipment: {
    type: Number,
    default: 0,
    min: 0
  },
  
  total: {
    type: Number,
    required: true,
    min: 0
  },
  
  currency: {
    type: String,
    default: 'INR',
    uppercase: true
  },
  
  // Detailed breakdown
  breakdown: [{
    category: {
      type: String,
      required: true
    },
    item: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    unit: String,
    unitCost: {
      type: Number,
      required: true,
      min: 0
    },
    totalCost: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  
  // Calculation metadata
  calculatedAt: {
    type: Date,
    default: Date.now
  },
  
  basedOnFloorPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FloorPlan'
  },
  
  calculationMethod: {
    type: String,
    enum: ['automatic', 'manual', 'ai'],
    default: 'automatic'
  },
  
  // Input parameters used for calculation (for reference)
  calculationInputs: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Active status (for version management)
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Ownership
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
costEstimateSchema.index({ project: 1, isActive: 1 });
costEstimateSchema.index({ project: 1, version: -1 });
costEstimateSchema.index({ createdBy: 1, createdAt: -1 });

// Pre-save hook to auto-increment version for the same project
costEstimateSchema.pre('save', async function(next) {
  if (this.isNew && this.project) {
    const latestVersion = await this.constructor.findOne({ project: this.project })
      .sort({ version: -1 })
      .select('version');
    
    if (latestVersion) {
      this.version = latestVersion.version + 1;
    }
  }
  next();
});

// Pre-save hook to calculate total if not provided
costEstimateSchema.pre('save', function(next) {
  if (!this.total || this.total === 0) {
    this.total = (this.materials || 0) + (this.labor || 0) + 
                 (this.permits || 0) + (this.equipment || 0);
  }
  next();
});

// Instance method to deactivate other versions when activating this one
costEstimateSchema.methods.activate = async function() {
  if (this.project) {
    // Deactivate all other cost estimates for this project
    await this.constructor.updateMany(
      { 
        project: this.project, 
        _id: { $ne: this._id } 
      },
      { isActive: false }
    );
  }
  
  this.isActive = true;
  await this.save();
  
  // Update project reference
  const Project = mongoose.model('Project');
  await Project.findByIdAndUpdate(this.project, {
    activeCostEstimate: this._id
  });
  
  return this;
};

// Static method to get active cost estimate for a project
costEstimateSchema.statics.getActiveForProject = function(projectId) {
  return this.findOne({ 
    project: projectId, 
    isActive: true 
  }).sort({ createdAt: -1 });
};

const CostEstimate = mongoose.model('CostEstimate', costEstimateSchema);

module.exports = CostEstimate;
