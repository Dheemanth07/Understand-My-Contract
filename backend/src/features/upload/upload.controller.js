import * as uploadService from "./upload.service.js";

async function uploadHandler(req, res) {
    return uploadService.handleUpload(req, res);
}

export { uploadHandler };

