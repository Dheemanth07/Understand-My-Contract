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
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;

// ---------- Init Express ----------
const app = express();
app.use(cors());
app.use(express.json()); // parse JSON
const upload = multer();

// ---------- MongoDB Setup ----------
mongoose
    .connect(process.env.MONGODB_URI, {
        dbName: "legal_simplifier",
    })
    .then(() => {
        console.log("✅ MongoDB connected");
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err.message);
    });

const AnalysisSchema = new mongoose.Schema(
    {
        filename: String,
        mimeType: String,
        inputLang: String,
        outputLang: String,
        sections: [
            {
                original: String,
                summary: String,
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
const allowedLangs = ["kan", "eng", "hin", "tam", "tel"];

function containsKannada(text) {
    return /[\u0C80-\u0CFF]/.test(text);
}

async function detectLanguage(text) {
    try {
        if (containsKannada(text)) return "kn";
        const lang3 = franc(text, { whitelist: allowedLangs, minLength: 10 });
        return langMap[lang3] || "en";
    } catch {
        return "en";
    }
}

// -------------------- Translation --------------------
async function translate(text, src, tgt) {
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
    const chunks = chunkSection(section, 500);
    if (!chunks.length) return "";

    const summaries = [];
    for (const chunk of chunks) {
        try {
            const resp = await axios.post(
                "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
                {
                    inputs: `Summarize this legal text in plain English, 2-3 clear bullet points:\n\n${chunk}`,
                    parameters: { max_new_tokens: 300, temperature: 0.3 },
                },
                {
                    headers: {
                        Authorization: `Bearer ${HUGGINGFACE_API_KEY}`,
                        "Content-Type": "application/json",
                    },
                    timeout: 60000, // 60 sec timeout per chunk
                }
            );

            // Hugging Face returns an array [{ generated_text: "..." }]
            if (Array.isArray(resp.data) && resp.data.length > 0) {
                summaries.push(resp.data[0].generated_text.trim());
            } else {
                summaries.push("(No summary returned)");
            }
        } catch (err) {
            console.error("Summarization API failed:", err.message);
            summaries.push("(Failed to summarize)");
        }
    }

    return summaries.join(" ");
}

// -------------------- Glossary Helpers --------------------
function extractJargon(text) {
    // Very naive: Proper nouns or legalistic words
    const matches = text.match(/\b[A-Z][a-zA-Z]{3,}\b/g) || [];
    return [...new Set(matches)];
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
            return res.status(401).json({ error: "No auth token" });

        // Verify Supabase JWT
        const token = authorization.replace("Bearer ", "");
        const { data: user, error: authError } = await supabase.auth.getUser(
            token
        );
        if (authError || !user?.user) {
            return res.status(401).json({ error: "Invalid Supabase token" });
        }
        const userId = user.user.id;
        if (!req.file)
            return res.status(400).json({ error: "No file uploaded" });

        const lang = req.query.lang || "en";

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();

        let text;
        if (req.file.mimetype === "text/plain") {
            text = req.file.buffer.toString();
        } else if (req.file.mimetype === "application/pdf") {
            const data = await pdfParse(req.file.buffer);
            text = data.text.trim();
            if (!text) {
                res.write(
                    `data: {"error":"PDF contains no readable text"}\n\n`
                );
                return res.end();
            } else if (
                req.file.mimetype ===
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
                req.file.originalname.endsWith(".docx")
            ) {
                // DOCX support
                const result = await mammoth.extractRawText({
                    buffer: req.file.buffer,
                });
                text = result.value.trim();
                if (!text) {
                    res.write(
                        `data: {"error":"DOCX contains no readable text"}\n\n`
                    );
                    return res.end();
                }
            }
        } else {
            res.write(`data: {"error":"Unsupported file type"}\n\n`);
            return res.end();
        }

        // Detect language and translate if needed
        const detectedLang = await detectLanguage(text);
        if (detectedLang === "kn") text = await translate(text, "kn", "en");

        //Split and summarize
        const sections = splitIntoSections(text);
        let glossary = {};
        let collectedSections = [];

        for (let i = 0; i < sections.length; i++) {
            const englishSummary = await summarizeSection(sections[i]);

            let output = englishSummary;
            if (lang === "kn") {
                output = await translate(englishSummary, "en", "kn");
            }

            // Extract glossary terms
            const terms = extractJargon(sections[i]);
            for (const term of terms) {
                if (!glossary[term]) {
                    glossary[term] = await lookupDefinition(term);
                }
            }

            const msg = {
                section: i + 1,
                original: sections[i],
                summary: output || "(failed to summarize)",
                inputLang: detectedLang,
                outputLang: req.query.lang || "en",
            };

            collectedSections.push({
                original: sections[i],
                summary: output || "",
            });
            res.write(`data: ${JSON.stringify(msg)}\n\n`);
        }

        // Save metadata to Supabase
        const { error: supabaseError } = await supabase.from("uploads").insert({
            user_id: userId,
            file_name: req.file.originalname,
            uploaded_at: new Date(),
        });
        if (supabaseError) {
            console.error("Supabase insert error:", supabaseError.message);
        }

        // Stream glossary at the end
        res.write(`data: ${JSON.stringify({ glossary })}\n\n`);
        res.write(`data: {"done": true}\n\n`);

        // Save full analysis to MongoDB
        await Analysis.create({
            filename: req.file.originalname,
            userId,
            sections: collectedSections,
            glossary,
        });

        res.end();
    } catch (err) {
        console.error("❌ Error in /upload:", err.message);
        res.status(500).json({ error: "Processing failed" });
    }
});

// -------------------- History Endpoints --------------------
app.get("/history", async (req, res) => {
    try {
        const docs = await Analysis.find({}, { sections: 0, glossary: 0 })
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(docs);
    } catch (e) {
        console.error("History fetch failed", e);
        res.status(500).json({ error: "Failed to fetch history" });
    }
});

app.get("/history/:id", async (req, res) => {
    try {
        const doc = await Analysis.findById(req.params.id);
        if (!doc) return res.status(404).json({ error: "Not found" });
        res.json(doc);
    } catch (e) {
        console.error("Analysis fetch failed", e);
        res.status(500).json({ error: "Failed to fetch analysis" });
    }
});

// -------------------- Start Server --------------------

app.listen(PORT, () => {
    console.log(`✅ Server listening on port ${PORT}...`);
});
