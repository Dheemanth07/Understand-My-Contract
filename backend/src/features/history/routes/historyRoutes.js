const express = require("express");

const {
    listHandler,
    getByIdHandler,
    deleteHandler,
} = require("../controller/HistoryController");

const router = express.Router();
router.get("/", listHandler);
router.get("/:id", getByIdHandler);
router.delete("/:id", deleteHandler);

module.exports = router;

