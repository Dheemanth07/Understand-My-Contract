// backend/server.js
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const { franc } = require("franc-min");
const { pipeline } = require("@xenova/transformers");
const axios = require("axios");
const mammoth = require("mammoth");
const mongoose = require("mongoose");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const PORT = process.env.PORT || 5000;

const app = express();
app.use(cors());
app.use(express.json());
const upload = multer();

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => console.error("MongoDB connection error:", err.message));

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

const Analysis = mongoose.model("Analysis", AnalysisSchema);

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// -------------------- HELPER FUNCTIONS --------------------

let translator = null;
async function initModels() {
    if (!translator) {
        console.log("Initializing translation model...");
        translator = await pipeline("translation", "Xenova/m2m100_418M");
        console.log("✅ Translation model initialized.");
    }
}

async function extractTextFromFile(file) {
    if (!file) throw new Error("No file provided.");
    console.log(
        `Extracting text from: ${file.originalname} (${file.mimetype})`
    );

    if (file.mimetype === "application/pdf") {
        const data = await pdfParse(file.buffer);
        return data.text.trim();
    }
    if (
        file.mimetype ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.originalname.endsWith(".docx")
    ) {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        return result.value.trim();
    }
    if (file.mimetype === "text/plain") {
        return file.buffer.toString("utf8");
    }
    throw new Error(`Unsupported file type: ${file.mimetype}`);
}

function splitIntoSections(text) {
    const rawSections = text.split(/\n\s*\n|(?<=\.)\s*\n/);
    return rawSections.map((s) => s.trim()).filter(Boolean);
}

const langMap = { eng: "en", kan: "kn", hin: "hi", tam: "ta", tel: "te" };
async function detectLanguage(text) {
    try {
        if (/[\u0C80-\u0CFF]/.test(text)) return "kn";
        const lang3 = franc(text, {
            whitelist: Object.keys(langMap),
            minLength: 10,
        });
        return langMap[lang3] || "en";
    } catch {
        return "en";
    }
}

async function translate(text, src, tgt) {
    if (src === tgt) return text;
    try {
        await initModels();
        const output = await translator(text, { src_lang: src, tgt_lang: tgt });
        return output[0].translation_text;
    } catch (err) {
        console.error("Translation failed:", err.message);
        return text;
    }
}

function extractJargon(text) {
    const foundTerms = new Set();
    // Regex to find capitalized words (potential jargon)
    (text.match(/\b[A-Z][a-zA-Z]{3,}\b/g) || []).forEach((term) =>
        foundTerms.add(term)
    );
    return Array.from(foundTerms);
}

async function lookupDefinition(word) {
    try {
        const resp = await axios.get(
            `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`
        );
        const meaning = resp.data[0]?.meanings[0]?.definitions[0]?.definition;
        return meaning || `Definition not found for ${word}`;
    } catch {
        return `Definition not found for ${word}`;
    }
}

async function summarizeSection(section) {
    try {
        const apiKey = process.env.HUGGING_FACE_API_KEY;
        if (!apiKey) {
            console.error("Hugging Face API key is missing from .env file!");
            return "(Configuration Error: API Key is Missing)";
        }
        const resp = await axios.post(
            "https://api-inference.huggingface.co/models/facebook/bart-large-cnn",
            { inputs: section },
            { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 600000 }
        );
        return resp.data[0]?.summary_text.trim() || "(No summary returned)";
    } catch (err) {
        console.error("Summarization API failed:", err.message);
        if (err.response) {
            console.error("Error details:", err.response.data);
        }
        return "(Failed to summarize)";
    }
}

async function getUserFromToken(req) {
    const { authorization } = req.headers;
    if (!authorization) return null;
    const token = authorization.replace("Bearer ", "");
    const {
        data: { user },
    } = await supabase.auth.getUser(token);
    return user;
}

// -------------------- ROUTES --------------------

app.post("/upload", upload.single("file"), async (req, res) => {
    let analysisId = null;
    try {
        const user = await getUserFromToken(req);
        if (!user) {
            return res.status(401).json({ error: "Invalid Supabase token" });
        }
        const userId = user.id;

        const lang = req.query.lang || "en";
        const text = await extractTextFromFile(req.file);

        if (!text) {
            return res
                .status(400)
                .json({ error: "File contains no readable text." });
        }

        const detectedLang = await detectLanguage(text);

        const newAnalysis = await Analysis.create({
            userId,
            filename: req.file.originalname,
            status: "processing",
            mimeType: req.file.mimetype,
            inputLang: detectedLang,
            outputLang: lang,
            sections: [],
            glossary: {},
        });
        analysisId = newAnalysis._id;

        const sections = splitIntoSections(text);
        res.setHeader("Content-Type", "text/event-stream");
        res.flushHeaders();
        res.write(
            `data: ${JSON.stringify({
                totalSections: sections.length,
                analysisId: analysisId,
            })}\n\n`
        );

        let mainGlossary = {};

        for (let i = 0; i < sections.length; i++) {
            const sectionText = sections[i];
            const englishSummary = await summarizeSection(sectionText);
            const targetLangSummary = await translate(
                englishSummary,
                "en",
                lang
            );

            const terms = extractJargon(sectionText);
            let sectionTerms = [];
            for (const term of terms) {
                if (!mainGlossary[term]) {
                    mainGlossary[term] = await lookupDefinition(term);
                    await new Promise((resolve) => setTimeout(resolve, 200));
                }
                sectionTerms.push({ term, definition: mainGlossary[term] });
            }

            const sectionData = {
                original: sectionText,
                summary: targetLangSummary,
                legalTerms: sectionTerms,
            };

            await Analysis.updateOne(
                { _id: analysisId },
                { $push: { sections: sectionData } }
            );
            res.write(
                `data: ${JSON.stringify({
                    section: i + 1,
                    ...sectionData,
                })}\n\n`
            );
        }

        await Analysis.updateOne(
            { _id: analysisId },
            { $set: { status: "completed", glossary: mainGlossary } }
        );
        res.write(`data: {"done": true}\n\n`);
        res.end();
    } catch (err) {
        console.error("❌ Error in /upload:", err.message);
        if (analysisId) {
            await Analysis.updateOne(
                { _id: analysisId },
                { $set: { status: "failed" } }
            );
        }
        if (!res.headersSent) {
            res.status(500).json({ error: "Processing failed" });
        } else {
            res.end();
        }
    }
});

app.get("/history", async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user)
            return res.status(401).json({ error: "Authentication required" });
        const docs = await Analysis.find(
            { userId: user.id },
            { filename: 1, createdAt: 1, _id: 1 }
        )
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();
        res.json(
            docs.map((doc) => ({
                id: doc._id,
                filename: doc.filename,
                createdAt: doc.createdAt,
            }))
        );
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch history" });
    }
});

app.get("/history/:id", async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user)
            return res.status(401).json({ error: "Authentication required" });
        const { id } = req.params;
        const doc = await Analysis.findById(id).lean();
        if (!doc || doc.userId !== user.id) {
            return res
                .status(404)
                .json({ error: "Document not found or access denied" });
        }
        res.json(doc);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch analysis" });
    }
});

app.delete("/history/:id", async (req, res) => {
    try {
        // 1. Verify the user is logged in
        const user = await getUserFromToken(req);
        if (!user) {
            return res.status(401).json({ error: "Authentication required" });
        }

        const { id } = req.params;

        // 2. Find the document in MongoDB and delete it
        // This query ensures a user can only delete their own documents
        const result = await Analysis.findOneAndDelete({
            _id: id,
            userId: user.id,
        });

        if (!result) {
            return res
                .status(404)
                .json({ error: "Document not found or access denied" });
        }

        // 3. (Optional but recommended) Delete the record from the Supabase 'uploads' table
        await supabase
            .from("uploads")
            .delete()
            .match({ file_name: result.filename, user_id: user.id });

        res.status(200).json({ message: "Document deleted successfully" });
    } catch (e) {
        console.error("Delete error:", e);
        res.status(500).json({ error: "Failed to delete document" });
    }
});

// -------------------- Start Server --------------------
app.listen(PORT, () => {
    console.log(`✅ Server listening on port ${PORT}...`);
});
