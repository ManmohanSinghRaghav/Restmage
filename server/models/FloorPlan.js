const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema({
  x_ft: {
    type: Number,
    required: true
  },
  y_ft: {
    type: Number,
    required: true
  }
}, { _id: false });

const floorPlanSchema = new mongoose.Schema({
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
  
  // Floor plan name/title
  name: {
    type: String,
    trim: true,
    maxlength: 200
  },
  
  // Map metadata
  mapInfo: {
    title: String,
    author: String,
    date: String,
    scale: String,
    north_direction: {
      type: String,
      default: 'up'
    }
  },
  
  // Plot summary with dimensions and setbacks
  plotSummary: {
    plot_width_ft: Number,
    plot_length_ft: Number,
    setback_front_ft: Number,
    setback_rear_ft: Number,
    setback_side_left_ft: Number,
    setback_side_right_ft: Number
  },
  
  // Rooms with polygons
  rooms: [{
    name: String,
    type: String,
    polygon: [pointSchema],
    color: String
  }],
  
  // Walls
  walls: [{
    start: pointSchema,
    end: pointSchema,
    thickness_ft: Number
  }],
  
  // Doors
  doors: [{
    position: pointSchema,
    width_ft: Number,
    swing: {
      type: String,
      enum: ['inward', 'outward', 'left', 'right']
    }
  }],
  
  // Windows
  windows: [{
    position: pointSchema,
    width_ft: Number
  }],
  
  // Stairs (optional)
  stairs: [{
    footprint: [pointSchema],
    direction: String,
    steps: Number
  }],
  
  // Fixtures (optional)
  fixtures: [{
    position: pointSchema,
    type: String,
    rotation: Number
  }],
  
  // Generation metadata
  generatedBy: {
    type: String,
    enum: ['ai', 'manual'],
    default: 'manual'
  },
  
  generationInputs: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // Active status (for version management)
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Ownership and collaboration
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
floorPlanSchema.index({ project: 1, isActive: 1 });
floorPlanSchema.index({ project: 1, version: -1 });
floorPlanSchema.index({ createdBy: 1, createdAt: -1 });

// Pre-save hook to auto-increment version for the same project
floorPlanSchema.pre('save', async function(next) {
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

// Instance method to deactivate other versions when activating this one
floorPlanSchema.methods.activate = async function() {
  if (this.project) {
    // Deactivate all other floor plans for this project
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
    activeFloorPlan: this._id
  });
  
  return this;
};

// Static method to get active floor plan for a project
floorPlanSchema.statics.getActiveForProject = function(projectId) {
  return this.findOne({ 
    project: projectId, 
    isActive: true 
  }).sort({ createdAt: -1 });
};

const FloorPlan = mongoose.model('FloorPlan', floorPlanSchema);

module.exports = FloorPlan;
