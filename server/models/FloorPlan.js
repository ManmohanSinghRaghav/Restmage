const mongoose = require('mongoose');

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
  
  // Map metadata - use Mixed for flexibility
  mapInfo: mongoose.Schema.Types.Mixed,
  
  // Plot summary - use Mixed for flexibility
  plotSummary: mongoose.Schema.Types.Mixed,
  
  // Rooms - use Mixed for flexibility with AI-generated data
  rooms: [mongoose.Schema.Types.Mixed],
  
  // Walls - use Mixed for flexibility
  walls: [mongoose.Schema.Types.Mixed],
  
  // Doors - use Mixed for flexibility
  doors: [mongoose.Schema.Types.Mixed],
  
  // Windows - use Mixed for flexibility
  windows: [mongoose.Schema.Types.Mixed],
  
  // Stairs (optional)
  stairs: [mongoose.Schema.Types.Mixed],
  
  // Fixtures (optional)
  fixtures: [mongoose.Schema.Types.Mixed],
  
  // Generation metadata
  generatedBy: {
    type: String,
    enum: ['ai', 'manual'],
    default: 'manual'
  },
  
  generationInputs: mongoose.Schema.Types.Mixed,
  
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
  timestamps: true,
  strict: false  // Allow fields not defined in schema
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
