const express = require("express");

const {
    listHandler,
    getActiveHandler,
    getByIdHandler,
    deleteHandler,
    chatHandler,
    generalChatHandler,
    getMergedGlossaryHandler,
    stopHandler,
} = require("./history.controller");

const router = express.Router();
router.get("/", listHandler);
router.get("/active/doc", getActiveHandler);
router.get("/glossary/all", getMergedGlossaryHandler);
router.post("/chat/general", generalChatHandler);
router.get("/:id", getByIdHandler);
router.post("/:id/chat", chatHandler);
router.delete("/:id", deleteHandler);
router.post("/:id/stop", stopHandler);

module.exports = router;
