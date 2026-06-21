const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        
        const allowedOrigins = [
            "http://localhost:5173",
            "http://localhost:8080",
            "http://localhost:8081",
            "https://understand-my-contract.vercel.app",
            "https://www.understand-my-contract.vercel.app"
        ];
        
        if (process.env.FRONTEND_URL) {
            allowedOrigins.push(process.env.FRONTEND_URL);
        }
        
        const isVercelPreview = /\.vercel\.app$/.test(origin);
        const isLocalhost = /^http:\/\/localhost:\d+$/.test(origin);
        
        if (allowedOrigins.indexOf(origin) !== -1 || isLocalhost || isVercelPreview) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options(/^.*$/, cors(corsOptions));
app.use(express.json());

// Mount routers
const uploadRouter = require("./features/upload/routes/uploadRoutes");
const historyRouter = require("./features/history/routes/historyRoutes");

app.use("/upload", uploadRouter);
app.use("/history", historyRouter);

module.exports = app;
