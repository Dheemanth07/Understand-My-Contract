import express from "express";
import multer from "multer";
import { uploadHandler } from "./upload.controller.js";

const upload = multer({
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

const router = express.Router();
router.post("/", upload.single("file"), uploadHandler);

export default router;

