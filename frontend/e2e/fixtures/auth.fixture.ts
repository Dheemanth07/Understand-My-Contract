import { test as baseTest } from '@playwright/test';
import mongoose from 'mongoose';
import { TEST_USERS } from './testData';

// Extend base test with an authenticatedPage fixture
export const test = baseTest.extend<{
  createTestUser: (overrides?: Partial<{ email: string; password: string; userId: string }>) => Promise<any>;
}>({
  createTestUser: async ({}, use) => {
    async function createTestUser(overrides = {}) {
      // Ensure mongoose is connected
      const uri = process.env.MONGODB_URI_TEST || process.env.MONGODB_URI;
      if (!mongoose.connection.readyState) {
        await mongoose.connect(uri as string);
      }
      // Minimal user document — backend may use Supabase for auth, but for tests we seed a users collection to track records
      const Users = mongoose.connection.collection('users');
      const user = Object.assign({}, TEST_USERS[0], overrides);
      await Users.insertOne(user);
      return user;
    }

    await use(createTestUser);

    // cleanup: remove test users created in this fixture
    try {
      const uri = process.env.MONGODB_URI_TEST || process.env.MONGODB_URI;
      if (mongoose.connection.readyState) {
        const Users = mongoose.connection.collection('users');
        await Users.deleteMany({ email: /^e2e_user/ });
      }
    } catch (e) {
      // ignore cleanup errors
    }
  },
});

export { expect } from '@playwright/test';
