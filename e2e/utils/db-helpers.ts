import mongoose from "mongoose";

export async function connectTestDB(uri?: string) {
    const mongoUri =
        uri || process.env.MONGODB_URI_TEST || process.env.MONGODB_URI;
    if (!mongoUri) throw new Error("MONGODB_URI_TEST not set");
    await mongoose.connect(mongoUri as string, { dbName: "e2e_tests" });
}

export async function disconnectTestDB() {
    if (mongoose.connection.readyState) await mongoose.disconnect();
}

export async function clearAllCollections() {
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection is not established");

    const collections = await db.collections();
    for (const coll of collections) {
        try {
            await coll.deleteMany({});
        } catch (e) {
            // ignore
        }
    }
}

export async function seedTestUser(user: Record<string, unknown>) {
    const Users = mongoose.connection.collection("users");
    const r = await Users.insertOne(user);
    return r.insertedId;
}

export async function seedTestAnalysis(doc: Record<string, unknown>) {
    const Analysis = mongoose.connection.collection("analyses");
    const r = await Analysis.insertOne(doc);
    return r.insertedId;
}
