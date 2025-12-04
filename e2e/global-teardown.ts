import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { stopTestServer } from '../backend/server.test.js';

export default async function globalTeardown() {
  try {
    if (mongoose.connection.readyState) {
      await mongoose.disconnect();
    }
    // Stop the test backend server if it exists
    if ((global as any).testServer) {
      console.log('Global teardown: stopping backend server...');
      await stopTestServer((global as any).testServer.server);
      console.log('✅ Backend server stopped');
    }
  } catch (err) {
    console.warn('Error disconnecting mongoose during global teardown:', err);
  }

  const marker = path.resolve(process.cwd(), 'e2e', '.e2e-setup');
  if (fs.existsSync(marker)) {
    try {
      fs.unlinkSync(marker);
    } catch (e) {
      // ignore
    }
  }
}
