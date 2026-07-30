import express from "express";

import {
    listHandler,
    getActiveHandler,
    getByIdHandler,
    deleteHandler,
    chatHandler,
    generalChatHandler,
    getMergedGlossaryHandler,
    stopHandler,
} from "./history.controller.js";

const router = express.Router();
router.get("/", listHandler);
router.get("/active/doc", getActiveHandler);
router.get("/glossary/all", getMergedGlossaryHandler);
router.post("/chat/general", generalChatHandler);
router.get("/:id", getByIdHandler);
router.post("/:id/chat", chatHandler);
router.delete("/:id", deleteHandler);
router.post("/:id/stop", stopHandler);

export default router;

