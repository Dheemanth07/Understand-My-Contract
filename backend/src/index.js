import mongoose from "mongoose";
import app from "./app.js";

const PORT = process.env.PORT || 5000;

async function connectDB() {
    const uri = process.env.MONGODB_URI;
    try {
        if (!uri) {
            throw new Error("MONGODB_URI is not defined");
        }
        await mongoose.connect(uri);
        console.log("✅ MongoDB connected");
    } catch (err) {
        console.warn(`⚠️ External MongoDB connection failed: ${err.message}`);
        console.log("ℹ️ Attempting to start in-memory MongoDB fallback...");
        try {
            const { MongoMemoryServer } = await import("mongodb-memory-server");
            const mongoServer = await MongoMemoryServer.create();
            const mongoUri = mongoServer.getUri();
            await mongoose.connect(mongoUri);
            console.log(`✅ MongoDB connected to in-memory instance`);
            
            process.on("SIGINT", async () => {
                await mongoose.disconnect();
                await mongoServer.stop();
                process.exit(0);
            });
        } catch (fallbackErr) {
            console.error("❌ Failed to start in-memory MongoDB fallback:", fallbackErr.message);
            process.exit(1);
        }
    }
}

if (process.argv[1] && (process.argv[1].endsWith("server.js") || process.argv[1].endsWith("index.js"))) {
    connectDB().then(() => {
        app.listen(PORT, "0.0.0.0", () => {
            console.log(`✅ Server listening on port ${PORT} (0.0.0.0)...`);
        });
    });
}

export default app;
export { connectDB };

