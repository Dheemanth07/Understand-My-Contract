const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const axios = require("axios");
const { IGNORED_WORDS, LEGAL_DICTIONARY } = require("../../glossaryData");

const langMap = { eng: "en", kan: "kn", hin: "hi", tam: "ta", tel: "te" };

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
    throw new Error(`Unsupported file type: ${file.mimetype}`);
}

function splitIntoSections(text) {
    if (!text) return [];
    const rawSections = text.split(/\n\s*\n|(?<=\.)\s*\n/);
    return rawSections.map((s) => s.trim()).filter(Boolean);
}

async function detectLanguage(text) {
    try {
        // quick check for Kannada script (uses unicode range)
        if (/[\u0C80-\u0CFF]/.test(text)) return "kn";

        let francFunc;
        try {
            // use require so that jest.mock can intercept this import
            // (dynamic import in tests was returning an object and breaking mocks)
            const francModule = require("franc-min");
            // the module may export a function directly or an object with a
            // `franc` property (depending on how it's mocked), so handle both.
            francFunc =
                typeof francModule === "function"
                    ? francModule
                    : francModule.franc || francModule.default?.franc || francModule;
        } catch (e) {
            // if the package isn't available or require fails, default to English
            francFunc = () => "eng";
        }

        const lang3 = francFunc(text, {
            whitelist: Object.keys(langMap),
            minLength: 10,
        });
        return langMap[lang3] || "en";
    } catch (err) {
        // on any unexpected error, default to English to keep app stable
        return "en";
    }
}

async function translate(text, src, tgt) {
    if (src === tgt) return text;
    const apiKey = process.env.HUGGING_FACE_API_KEY;
    if (!apiKey) return text;
    const maxLength = 3000;
    const textToProcess = text.length > maxLength ? text.substring(0, maxLength) : text;
    let retries = 3;
    while (retries > 0) {
        try {
            const resp = await axios.post(
                "https://router.huggingface.co/hf-inference/models/facebook/m2m100_418M",
                { inputs: textToProcess, parameters: { src_lang: src, tgt_lang: tgt } },
                { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 20000 }
            );
            return resp.data[0]?.translation_text || resp.data[0]?.generated_text || text;
        } catch (err) {
            const status = err.response?.status;
            if (status === 503 || status === 504) {
                retries--; await new Promise((r) => setTimeout(r, 3000));
            } else {
                return text;
            }
        }
    }
    return text;
}

async function summarizeSection(section) {
    if (!section || section.trim() === '') {
        return "(No summary returned)";
    }
    const apiKey = process.env.HUGGING_FACE_API_KEY;
    if (!apiKey) return `(Configuration Error: API Key is Missing)`;
    const maxLength = 3000;
    const textToProcess = section.length > maxLength ? section.substring(0, maxLength) : section;
    let retries = 3;
    while (retries > 0) {
        try {
            const resp = await axios.post(
                "https://router.huggingface.co/hf-inference/models/facebook/bart-large-cnn",
                { inputs: textToProcess, parameters: { max_length: 150, min_length: 40, do_sample: false } },
                { headers: { Authorization: `Bearer ${apiKey}` }, timeout: 600000 }
            );
            return resp.data[0]?.summary_text?.trim() || "(No summary returned)";
        } catch (err) {
            const status = err.response?.status;
            if (status === 503 || status === 504) {
                retries--; await new Promise((r) => setTimeout(r, 3000));
            } else {
                return '(Failed to summarize)';
            }
        }
    }
    return '(Failed to summarize)';
}

function extractJargon(text) {
    const foundTerms = new Set();
    // require at least 4 characters: initial capital + three letters
    (text.match(/\b[A-Z][a-zA-Z]{3,}\b/g) || []).forEach((term) => {
        if (!IGNORED_WORDS.has(term) && isNaN(term)) foundTerms.add(term);
    });
    Object.keys(LEGAL_DICTIONARY).forEach((key) => {
        if (text.includes(key)) foundTerms.add(key);
    });
    return Array.from(foundTerms);
}

async function lookupDefinition(word) {
    // quick sanity checks
    if (!word || typeof word !== 'string' || word.trim() === '') {
        return '(Definition not found)';
    }

    if (LEGAL_DICTIONARY[word]) {
        return LEGAL_DICTIONARY[word];
    }

    try {
        const resp = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        const meanings = resp.data[0]?.meanings;
        if (!meanings || meanings.length === 0) {
            return '(Definition not found)';
        }
        return meanings[0].definitions[0].definition || '(Definition not found)';
    } catch {
        return '(Definition not found)';
    }
}

module.exports = {
    extractTextFromFile,
    splitIntoSections,
    detectLanguage,
    translate,
    summarizeSection,
    extractJargon,
    lookupDefinition,
};
