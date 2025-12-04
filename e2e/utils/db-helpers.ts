import mongoose from 'mongoose';

export async function connectTestDB(uri?: string) {
  const mongoUri = uri || process.env.MONGODB_URI_TEST || process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI_TEST not set');
  await mongoose.connect(mongoUri as string, { dbName: 'e2e_tests' });
}

export async function disconnectTestDB() {
  if (mongoose.connection.readyState) await mongoose.disconnect();
}

export async function clearAllCollections() {
  const collections = await mongoose.connection.db.collections();
  for (const coll of collections) {
    try {
      await coll.deleteMany({});
    } catch (e) {
      // ignore
    }
  }
}

export async function seedTestUser(user) {
  const Users = mongoose.connection.collection('users');
  const r = await Users.insertOne(user);
  return r.insertedId;
}

export async function seedTestAnalysis(doc) {
  const Analysis = mongoose.connection.collection('analyses');
  const r = await Analysis.insertOne(doc);
  return r.insertedId;
}
