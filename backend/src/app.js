const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const corsOptions = {
    origin: [
        "http://localhost:5173",
        "https://understand-my-contract.vercel.app",
        "https://www.understand-my-contract.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options(/^.*$/, cors(corsOptions));
app.use(express.json());

// Mount routers
const uploadRouter = require("./routes/upload");
const historyRouter = require("./routes/history");

app.use("/upload", uploadRouter);
app.use("/history", historyRouter);

module.exports = app;
