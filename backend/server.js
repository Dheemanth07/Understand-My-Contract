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
const { request } = require("https");
require("dotenv").config();

const PORT = process.env.PORT || 5000;
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

// ---------- Init Express ----------
const app = express();
app.use(cors());
app.use(express.json()); // parse JSON
const upload = multer();

// ---------- MongoDB Setup ----------
mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("✅ MongoDB connected");
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err.message);
    });

const AnalysisSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true, index: true },
        filename: String,
        mimeType: String,
        inputLang: String,
        outputLang: String,
        sections: [
            {
                original: String,
                summary: String,
                legalTerms: [
                    {
                        term: String,
                        definition: String,
                    },
                ],
            },
        ],
        glossary: { type: Object, default: {} },
    },
    { timestamps: true }
);

const Analysis = mongoose.model("Analysis", AnalysisSchema);

// ---------- Supabase Setup ----------
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

let translator = null;

async function initModels() {
    if (!translator) {
        translator = await pipeline("translation", "Xenova/m2m100_418M");
    }
}

// -------------------- HELPER FUNCTIONS --------------------

// Extract text from various file types
async function extractTextFromFile(file) {
    if (!file) throw new Error("No file provided.");

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

    throw new Error("Unsupported file type");
}

// Split text into sections (by paragraphs)
function splitIntoSections(text) {
    const rawSections = text.split(/\n\s*\n|(?<=\.)\s*\n/);
    return rawSections.map((s) => s.trim()).filter(Boolean);
}

// Chunk section for API calls
function chunkSection(section, chunkSize = 500) {
    const chunks = [];
    let start = 0;
    while (start < section.length) {
        chunks.push(section.substring(start, start + chunkSize));
        start += chunkSize;
    }
    return chunks;
}

// -------------------- Language Detection --------------------
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

// -------------------- Translation --------------------
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

// -------------------- Summarization --------------------

async function summarizeSection(section) {
    try {
        const resp = await axios.post(
            "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
            {
                inputs: `Summarize this legal text in plain English, using clear bullet points:\n\n${section}`,
                parameters: { max_new_tokens: 300, temperature: 0.3 },
            },
            {
                headers: { Authorization: `Bearer ${HUGGINGFACE_API_KEY}` },
                timeout: 60000,
            }
        );
        return resp.data[0]?.generated_text.trim() || "(No summary returned)";
    } catch (err) {
        console.error("Summarization API failed:", err.message);
        return "(Failed to summarize)";
    }
}

// -------------------- Glossary Helpers --------------------
function extractJargon(text) {
    const foundTerms = new Set();
    const lowerText = text.toLowerCase();

    // Add capitalized words as a fallback
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

// -------------------- ROUTES --------------------

// Upload and simplify
app.post("/upload", upload.single("file"), async (req, res) => {
    try {
        const { authorization } = req.headers;
        if (!authorization)
            return res.status(401).json({ error: "No auth token provided" });

        // Verify Supabase JWT
        const token = authorization.replace("Bearer ", "");
        const { data: user, error: authError } = await supabase.auth.getUser(
            token
        );
        if (authError || !user?.user) {
            return res.status(401).json({ error: "Invalid Supabase token" });
        }
        const userId = user.user.id;

        const lang = req.query.lang || "en";

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Transfer-Encoding", "chunked");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();

        const text = await extractTextFromFile(req.file);
        if (!text) {
            res.write(
                `data: ${JSON.stringify({
                    error: "File contains no readable text.",
                })}\n\n`
            );
            return res.end();
        }

        // Detect language and translate if needed
        const detectedLang = await detectLanguage(text);
        const englishText = await translate(text, detectedLang, "en");

        //Split and summarize
        const sections = splitIntoSections(text);
        let glossary = {};
        let collectedSections = [];

        res.write(
            `data: ${JSON.stringify({ totalSections: sections.length })}\n\n`
        );

        for (let i = 0; i < sections.length; i++) {
            const sectionText = sections[i];
            const englishSummary = await summarizeSection(sectionText);
            const targetLangSummary = await translate(
                englishSummary,
                "en",
                lang
            );

            // Extract glossary terms
            const terms = extractJargon(sectionText);
            let sectionTerms = [];
            for (const term of terms) {
                if (!glossary[term]) {
                    glossary[term] = await lookupDefinition(term);
                }
                sectionTerms.push({ term, definition: glossary[term] });
            }

            const sectionData = {
                original: sectionText,
                summary: summaryInTargetLang,
                legalTerms: sectionTerms,
            };
            collectedSections.push(sectionData);

            res.write(
                `data: ${JSON.stringify({
                    section: i + 1,
                    ...sectionData,
                })}\n\n`
            );
        }

        // Save full analysis to MongoDB
        await Analysis.create({
            userId,
            filename: req.file.originalname,
            userId,
            mimeType: req.file.mimetype,
            inputLang: detectedLang,
            outputLang: lang,
            sections: collectedSections,
            glossary,
        });

        // Save metadata to Supabase
        await supabase.from("uploads").insert({
            user_id: userId,
            file_name: req.file.originalname,
            uploaded_at: new Date(),
        });

        res.write(`data: {"done": true}\n\n`);
        res.end();
    } catch (err) {
        console.error("❌ Error in /upload:", err.message);
        res.status(500).json({ error: "Processing failed" });
    }
});

// -------------------- History Endpoints --------------------

async function getUserFromToken(req) {
    const { authorization } = req.headers;
    if (!authorization) return null;
    const token = authorization.replace("Bearer ", "");
    const {
        data: { user },
    } = await supabase.auth.getUser(token);
    return user;
}

app.get("/history", async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user)
            return res.status(401).json({ error: "Authentication required" });

        const docs = await Analysis.find(
            { userId: user.id },
            { filename: 1, createdAt: 1, _id: 1 } // Projection
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

// -------------------- Start Server --------------------

app.listen(PORT, () => {
    console.log(`✅ Server listening on port ${PORT}...`);
});
