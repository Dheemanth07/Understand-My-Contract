const express = require("express");

const {
    listHandler,
    getByIdHandler,
    deleteHandler,
    chatHandler,
    getMergedGlossaryHandler,
    stopHandler,
} = require("../controller/HistoryController");

const router = express.Router();
router.get("/", listHandler);
router.get("/glossary/all", getMergedGlossaryHandler);
router.get("/:id", getByIdHandler);
router.post("/:id/chat", chatHandler);
router.delete("/:id", deleteHandler);
router.post("/:id/stop", stopHandler);

module.exports = router;

