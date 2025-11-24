// Minimal test to debug the authorization issue
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../server/.env') });

async function debug() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const Project = require('../../../server/models/Project');
  const User = require('../../../server/models/User');
  
  // Find the test user
  const user = await User.findOne({ email: 'test@example.com' });
  console.log('User ID:', user._id);
  console.log('User ID (string):', user._id.toString());
  
  // Find the latest project
  const project = await Project.findOne({ owner: user._id }).sort({ createdAt: -1 });
  console.log('\nProject ID:', project._id);
  console.log('Project Owner:', project.owner);
  console.log('Project Owner (string):', project.owner.toString());
  
  // Test comparison
  console.log('\nComparison:');
  console.log('project.owner.toString() === user._id:', project.owner.toString() === user._id);
  console.log('project.owner.toString() === user._id.toString():', project.owner.toString() === user._id.toString());
  console.log('project.owner.equals(user._id):', project.owner.equals(user._id));
  
  await mongoose.disconnect();
}

debug().catch(console.error);
