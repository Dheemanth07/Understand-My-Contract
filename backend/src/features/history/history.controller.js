const historyService = require("./history.service");

async function listHandler(req, res) {
    return historyService.list(req, res);
}

async function getByIdHandler(req, res) {
    return historyService.getById(req, res);
}

async function deleteHandler(req, res) {
    return historyService.deleteById(req, res);
}

async function chatHandler(req, res) {
    return historyService.chat(req, res);
}

async function getMergedGlossaryHandler(req, res) {
    return historyService.getMergedGlossary(req, res);
}

async function stopHandler(req, res) {
    return historyService.stop(req, res);
}

async function getActiveHandler(req, res) {
    return historyService.getActiveProcessing(req, res);
}

async function generalChatHandler(req, res) {
    return historyService.generalChat(req, res);
}

module.exports = {
    listHandler,
    getActiveHandler,
    getByIdHandler,
    deleteHandler,
    chatHandler,
    generalChatHandler,
    getMergedGlossaryHandler,
    stopHandler,
};
