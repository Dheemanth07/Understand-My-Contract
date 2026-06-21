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

async function chatHandler(req, res) {
    return HistoryService.chat(req, res);
}

async function getMergedGlossaryHandler(req, res) {
    return HistoryService.getMergedGlossary(req, res);
}

async function stopHandler(req, res) {
    return HistoryService.stop(req, res);
}

module.exports = {
    listHandler,
    getByIdHandler,
    deleteHandler,
    chatHandler,
    getMergedGlossaryHandler,
    stopHandler,
};

