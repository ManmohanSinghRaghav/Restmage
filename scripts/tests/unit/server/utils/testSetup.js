/**
 * Test Setup Utilities
 * Common setup functions for Jest tests
 */

const mongoose = require('mongoose');

/**
 * Connect to test database before all tests
 */
const connectTestDB = async () => {
  const testDBUri = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/restmage-test';
  
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(testDBUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  }
};

/**
 * Clear all collections after each test
 */
const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

/**
 * Close database connection after all tests
 */
const closeDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
};

module.exports = {
  connectTestDB,
  clearDatabase,
  closeDatabase
};
