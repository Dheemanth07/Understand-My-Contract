import { test as base } from '@playwright/test';
import mongoose from 'mongoose';

export const test = base.extend<{
  db: {
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    clearDatabase: () => Promise<void>;
    seedAnalysis: (doc: any) => Promise<any>;
    getAnalysisById: (id: string) => Promise<any>;
    deleteAnalysisById: (id: string) => Promise<void>;
  };
}>({
  db: async ({}, use) => {
    const uri = process.env.MONGODB_URI_TEST || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/understand_my_contract_test';

    async function connect() {
      if (!mongoose.connection.readyState) {
        await mongoose.connect(uri as string, { dbName: 'e2e_tests' });
      }
    }

    async function disconnect() {
      if (mongoose.connection.readyState) {
        await mongoose.disconnect();
      }
    }

    async function clearDatabase() {
      if (!mongoose.connection.readyState) await connect();
      const collections = await mongoose.connection.db.collections();
      for (const coll of collections) {
        try {
          await coll.deleteMany({});
        } catch (e) {
          // ignore
        }
      }
    }

    async function seedAnalysis(doc) {
      if (!mongoose.connection.readyState) await connect();
      const Analysis = mongoose.connection.collection('analyses');
      const r = await Analysis.insertOne(doc);
      return r.insertedId;
    }

    async function getAnalysisById(id) {
      if (!mongoose.connection.readyState) await connect();
      const Analysis = mongoose.connection.collection('analyses');
      return Analysis.findOne({ _id: typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id });
    }

    async function deleteAnalysisById(id) {
      if (!mongoose.connection.readyState) await connect();
      const Analysis = mongoose.connection.collection('analyses');
      await Analysis.deleteOne({ _id: typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id });
    }

    await use({ connect, disconnect, clearDatabase, seedAnalysis, getAnalysisById, deleteAnalysisById });

    // teardown
    try {
      await clearDatabase();
      await disconnect();
    } catch (e) {
      // ignore
    }
  },
});

export { expect } from '@playwright/test';
