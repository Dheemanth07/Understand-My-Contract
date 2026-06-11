const express = require("express");
const multer = require("multer");
const upload = multer();

const { uploadHandler } = require("../controller/UploadController");

const router = express.Router();
router.post("/", upload.single("file"), uploadHandler);

module.exports = router;

