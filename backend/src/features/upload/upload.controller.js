const uploadService = require("./upload.service");

async function uploadHandler(req, res) {
    return uploadService.handleUpload(req, res);
}

module.exports = { uploadHandler };
