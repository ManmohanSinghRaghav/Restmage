/**
 * Database Setup and Teardown Helpers
 * Used for integration tests that need direct database access
 */

const mongoose = require('mongoose');

/**
 * Connect to MongoDB for testing
 * @param {string} mongoUri - MongoDB connection string (from env or param)
 * @returns {Promise<void>}
 */
async function connectTestDB(mongoUri = process.env.MONGODB_URI) {
  if (!mongoUri) {
    throw new Error('MongoDB URI is required. Set MONGODB_URI environment variable.');
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('✓ Test database connected');
  } catch (error) {
    throw new Error(`Failed to connect to test database: ${error.message}`);
  }
}

/**
 * Disconnect from MongoDB
 * @returns {Promise<void>}
 */
async function disconnectTestDB() {
  try {
    await mongoose.connection.close();
    console.log('✓ Test database disconnected');
  } catch (error) {
    console.error('Error disconnecting from test database:', error.message);
  }
}

/**
 * Clear all documents from a collection
 * @param {string} collectionName - Name of collection to clear
 * @returns {Promise<number>} Number of deleted documents
 */
async function clearCollection(collectionName) {
  try {
    const result = await mongoose.connection.db.collection(collectionName).deleteMany({});
    return result.deletedCount;
  } catch (error) {
    throw new Error(`Failed to clear collection ${collectionName}: ${error.message}`);
  }
}

/**
 * Clear multiple collections
 * @param {Array<string>} collectionNames - Array of collection names
 * @returns {Promise<Object>} Object with collection names as keys and deleted counts as values
 */
async function clearCollections(collectionNames) {
  const results = {};
  
  for (const collectionName of collectionNames) {
    results[collectionName] = await clearCollection(collectionName);
  }
  
  return results;
}

/**
 * Drop entire database (use with caution!)
 * @returns {Promise<void>}
 */
async function dropTestDatabase() {
  try {
    await mongoose.connection.db.dropDatabase();
    console.log('⚠️  Test database dropped');
  } catch (error) {
    throw new Error(`Failed to drop database: ${error.message}`);
  }
}

/**
 * Get document count for a collection
 * @param {string} collectionName - Name of collection
 * @returns {Promise<number>} Document count
 */
async function getCollectionCount(collectionName) {
  try {
    return await mongoose.connection.db.collection(collectionName).countDocuments();
  } catch (error) {
    throw new Error(`Failed to count documents in ${collectionName}: ${error.message}`);
  }
}

/**
 * Get all collection names in database
 * @returns {Promise<Array<string>>} Array of collection names
 */
async function getAllCollections() {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    return collections.map(c => c.name);
  } catch (error) {
    throw new Error(`Failed to list collections: ${error.message}`);
  }
}

/**
 * Print database statistics
 * @returns {Promise<void>}
 */
async function printDatabaseStats() {
  try {
    const collections = await getAllCollections();
    
    console.log('\n📊 Database Statistics:');
    console.log('─'.repeat(40));
    
    for (const collectionName of collections) {
      const count = await getCollectionCount(collectionName);
      console.log(`  ${collectionName}: ${count} documents`);
    }
    
    console.log('─'.repeat(40));
  } catch (error) {
    console.error('Error printing database stats:', error.message);
  }
}

/**
 * Clean up test data (removes documents created during testing)
 * Identifies test data by common patterns (e.g., emails with 'test' or 'example')
 * @param {Array<string>} collectionNames - Collections to clean
 * @returns {Promise<Object>} Cleanup results
 */
async function cleanupTestData(collectionNames = ['users', 'projects', 'floorplans', 'costestimates']) {
  const results = {};
  
  try {
    for (const collectionName of collectionNames) {
      // Delete documents with test patterns
      const result = await mongoose.connection.db.collection(collectionName).deleteMany({
        $or: [
          { email: /test/i },
          { email: /example/i },
          { name: /test/i },
          { username: /test/i }
        ]
      });
      
      results[collectionName] = result.deletedCount;
    }
    
    console.log('🧹 Test data cleanup completed:', results);
    return results;
  } catch (error) {
    throw new Error(`Failed to cleanup test data: ${error.message}`);
  }
}

module.exports = {
  connectTestDB,
  disconnectTestDB,
  clearCollection,
  clearCollections,
  dropTestDatabase,
  getCollectionCount,
  getAllCollections,
  printDatabaseStats,
  cleanupTestData
};
