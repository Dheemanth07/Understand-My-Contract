const HistoryService = require("../service/HistoryService");

async function listHandler(req, res) {
    return HistoryService.list(req, res);
}

async function getByIdHandler(req, res) {
    return HistoryService.getById(req, res);
}

async function deleteHandler(req, res) {
    return HistoryService.deleteById(req, res);
}

module.exports = { listHandler, getByIdHandler, deleteHandler };

