require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function checkProjectStorage() {
  console.log('\n📊 Checking Project Creation & MongoDB Storage\n');
  console.log('='.repeat(80));

  try {
    // 1. Connect to MongoDB directly
    console.log('\n1️⃣  Connecting to MongoDB...');
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/restmage';
    console.log('MongoDB URI:', MONGODB_URI);
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get database name
    const dbName = mongoose.connection.db.databaseName;
    console.log('📦 Database Name:', dbName);

    // 2. Register/Login user
    console.log('\n2️⃣  Authenticating user...');
    const randomId = Math.floor(Math.random() * 10000);
    const testUser = {
      username: `testuser${randomId}`,
      email: `test${randomId}@example.com`,
      password: 'testpassword123'
    };

    let authToken;
    try {
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
      authToken = registerResponse.data.token;
      console.log('✅ User registered successfully');
    } catch (error) {
      // Try login if registration fails
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: testUser.email,
        password: testUser.password
      });
      authToken = loginResponse.data.token;
      console.log('✅ User logged in successfully');
    }

    // 3. Check initial project count in DB
    console.log('\n3️⃣  Checking initial project count in MongoDB...');
    const Project = require('../models/Project');
    const User = require('../models/User'); // Load models
    const initialCount = await Project.countDocuments();
    console.log(`📊 Initial projects in DB: ${initialCount}`);

    // 4. Create a project via API
    console.log('\n4️⃣  Creating new project via API...');
    const projectData = {
      name: 'MongoDB Test Project',
      description: 'Testing if projects are saved to MongoDB',
      location: 'Test City',
      propertyDetails: {
        type: 'residential',
        dimensions: {
          length: 50,
          width: 40,
          height: 12
        }
      }
    };

    const createResponse = await axios.post(
      `${BASE_URL}/projects`,
      projectData,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    console.log('✅ Project created via API');
    console.log('Project ID:', createResponse.data.project._id);
    console.log('Project Name:', createResponse.data.project.name);

    const createdProjectId = createResponse.data.project._id;

    // 5. Check project count after creation
    console.log('\n5️⃣  Verifying project in MongoDB...');
    
    // Wait a moment for the write to complete
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const afterCount = await Project.countDocuments();
    console.log(`📊 Projects in DB after creation: ${afterCount}`);
    
    // List all projects in the collection
    const allProjects = await Project.find().lean();
    console.log(`📋 Total projects found in collection: ${allProjects.length}`);
    if (allProjects.length > 0) {
      console.log('   First project ID:', allProjects[0]._id);
      console.log('   First project name:', allProjects[0].name);
    }

    // 6. Query MongoDB directly for the created project
    console.log('\n6️⃣  Querying MongoDB directly for the created project...');
    
    const projectInDb = await Project.findById(createdProjectId)
      .populate('owner', 'username email')
      .lean();

    if (projectInDb) {
      console.log('✅ Project found in MongoDB!');
      console.log('\n📄 Project Details from MongoDB:');
      console.log(JSON.stringify({
        _id: projectInDb._id,
        name: projectInDb.name,
        description: projectInDb.description,
        owner: projectInDb.owner,
        propertyDetails: projectInDb.propertyDetails,
        createdAt: projectInDb.createdAt,
        updatedAt: projectInDb.updatedAt
      }, null, 2));
    } else {
      console.log('❌ Project NOT found in MongoDB!');
    }

    // 7. Get all projects for the user via API
    console.log('\n6️⃣  Fetching all projects via API...');
    const listResponse = await axios.get(`${BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    console.log(`✅ Found ${listResponse.data.projects.length} projects via API`);
    console.log('Total in database:', listResponse.data.total);

    // 8. Update the project
    console.log('\n7️⃣  Updating project via API...');
    const updateResponse = await axios.put(
      `${BASE_URL}/projects/${createdProjectId}`,
      {
        name: 'MongoDB Test Project - UPDATED',
        description: 'Testing updates to MongoDB'
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    console.log('✅ Project updated via API');

    // 9. Verify update in MongoDB
    const updatedProjectInDb = await Project.findById(createdProjectId).lean();
    console.log('✅ Verified in MongoDB:');
    console.log('   Updated Name:', updatedProjectInDb.name);
    console.log('   Updated Description:', updatedProjectInDb.description);
    console.log('   Updated At:', updatedProjectInDb.updatedAt);

    // 10. Clean up - Delete test project
    console.log('\n8️⃣  Cleaning up - Deleting test project...');
    await axios.delete(`${BASE_URL}/projects/${createdProjectId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });

    const finalCount = await Project.countDocuments();
    console.log('✅ Project deleted');
    console.log(`📊 Final project count in DB: ${finalCount}`);

    // 11. List all collections and document counts
    console.log('\n9️⃣  MongoDB Collections Summary:');
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const collection of collections) {
      const count = await mongoose.connection.db.collection(collection.name).countDocuments();
      console.log(`   ${collection.name}: ${count} documents`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ SUCCESS: Projects are being created and stored in MongoDB correctly!');
    console.log('='.repeat(80));

    await mongoose.connection.close();

  } catch (error) {
    console.error('\n❌ Test Failed:');
    if (error.response) {
      console.error('API Error:', error.response.status);
      console.error('Message:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }

    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

checkProjectStorage();
