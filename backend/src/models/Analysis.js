const mongoose = require("mongoose");

const AnalysisSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true, index: true },
        status: { type: String, default: "processing" },
        filename: String,
        mimeType: String,
        inputLang: String,
        outputLang: String,
        sections: [
            {
                original: String,
                summary: String,
                legalTerms: [{ term: String, definition: String }],
            },
        ],
        glossary: { type: Object, default: {} },
    },
    { timestamps: true }
);

module.exports = mongoose.models.Analysis || mongoose.model("Analysis", AnalysisSchema);
