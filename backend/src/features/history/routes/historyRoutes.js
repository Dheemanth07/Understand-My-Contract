const express = require("express");

const {
    listHandler,
    getByIdHandler,
    deleteHandler,
    chatHandler,
    getMergedGlossaryHandler,
} = require("../controller/HistoryController");

const router = express.Router();
router.get("/", listHandler);
router.get("/glossary/all", getMergedGlossaryHandler);
router.get("/:id", getByIdHandler);
router.post("/:id/chat", chatHandler);
router.delete("/:id", deleteHandler);

module.exports = router;

