const UploadService = require("../service/UploadService");

async function uploadHandler(req, res) {
    return UploadService.handleUpload(req, res);
}

module.exports = { uploadHandler };

