import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { startTestServer } from '../backend/server.test.js';

export default async function globalSetup() {
  const mongoUri = process.env.MONGODB_URI_TEST || process.env.MONGODB_URI || '';

  if (!mongoUri) {
    console.warn('No MONGODB_URI_TEST found; skipping DB setup in global-setup.');
    return;
  }

  try {
    console.log('Global setup: connecting mongoose to', mongoUri);
    await mongoose.connect(mongoUri, { dbName: 'e2e_tests' });

    // Start the test backend server
    console.log('Global setup: starting test backend server...');
    const { server, port } = await startTestServer();
    process.env.VITE_BACKEND_URL = `http://localhost:${port}`;
    process.env.TEST_SERVER_INSTANCE = JSON.stringify({ port });
    console.log(`✅ Backend server started on port ${port}`);
    // Store server instance for shutdown in global-teardown
    (global as any).testServer = { server, port };

    // Expose connection info for teardown via a file
    const marker = path.resolve(process.cwd(), 'e2e', '.e2e-setup');
    fs.writeFileSync(marker, JSON.stringify({ mongoUri, backendPort: port }));
  } catch (err) {
    console.error('Error during global-setup:', err);
    throw err;
  }
}
