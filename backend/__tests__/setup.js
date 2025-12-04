const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Environment variables for testing
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-service-role-key';
process.env.HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY || 'test-hf-key';
process.env.PORT = process.env.PORT || 5001;

let mongoServer = null;

// Start MongoDB Memory Server before tests
beforeAll(async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    process.env.MONGODB_URI = mongoUri;
    
    // Connect Mongoose to in-memory database
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB Memory Server for tests');
  } catch (error) {
    console.error('❌ Failed to start MongoDB Memory Server:', error);
    throw error;
  }
});

// Stop MongoDB Memory Server after all tests
afterAll(async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
    console.log('✅ MongoDB Memory Server stopped');
  } catch (error) {
    console.error('❌ Error stopping MongoDB Memory Server:', error);
  }
});

// Set Jest timeout globally to 30000ms for AI operations
jest.setTimeout(30000);

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Restore all mocks after each test
afterEach(() => {
  jest.restoreAllMocks();
});
