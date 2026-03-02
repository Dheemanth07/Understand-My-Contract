const mongoose = require("mongoose");
const app = require("./app");

const PORT = process.env.PORT || 5000;

if (require.main === module) {
    mongoose
        .connect(process.env.MONGODB_URI)
        .then(() => {
            console.log("✅ MongoDB connected");
            app.listen(PORT, () => {
                console.log(`✅ Server listening on port ${PORT}...`);
            });
        })
        .catch((err) => {
            console.error("MongoDB connection error:", err && err.message);
            process.exit(1);
        });
}

module.exports = app;
