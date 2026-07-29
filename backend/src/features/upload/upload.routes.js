const express = require("express");
const multer = require("multer");

const upload = multer({
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

const { uploadHandler } = require("./upload.controller");

const router = express.Router();
router.post("/", upload.single("file"), uploadHandler);

module.exports = router;
