import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import "dotenv/config";

import uploadRouter from "./features/upload/upload.routes.js";
import historyRouter from "./features/history/history.routes.js";

const app = express();

// Secure Express headers
app.use(helmet());

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
        const isLocalConnection = /^http:\/\/(?:localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+)(?::\d+)?$/.test(origin);
        
        if (allowedOrigins.indexOf(origin) !== -1 || isLocalhost || isVercelPreview || isLocalConnection) {
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

app.use((req, res, next) => {
    console.log(`[HTTP] ${req.method} ${req.url}`);
    next();
});

// Global API Rate Limiter
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // Limit each IP to 300 requests per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests from this IP, please try again later." }
});
app.use(globalLimiter);

// Stricter Rate Limiter for Document Uploads
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 15, // Limit each IP to 15 document uploads per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many uploads. Please wait 15 minutes before uploading more documents." }
});

app.use("/upload", uploadLimiter, uploadRouter);
app.use("/history", historyRouter);

// Unhandled errors global handler (prevents stack traces from leaking in production)
app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }
    console.error("Unhandled server exception:", err);
    res.status(500).json({ error: "Internal Server Error" });
});

export default app;

