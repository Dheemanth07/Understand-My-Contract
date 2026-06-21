const { LEGAL_DICTIONARY } = require("../../../shared/glossary/glossaryData");
const {
    extractTextFromFile,
    splitIntoSections,
    detectLanguage,
    translate,
    summarizeSection,
    extractJargon,
    lookupDefinition,
    simplifyAndTranslateWithGemini,
    analyzeRisksWithGemini,
} = require("../../../shared/ai/processing");

const AnalysisRepository = require("../../../infrastructure/repositories/AnalysisRepository");
const { getUserFromToken } = require("../../../utils/auth");

async function processContractInBackground(analysisId, text, lang) {
    try {
        const sections = splitIntoSections(text);
        let mainGlossary = {};

        for (let i = 0; i < sections.length; i++) {
            // Heartbeat check: Query latest document state
            const doc = await AnalysisRepository.getById(analysisId);
            if (!doc) {
                console.warn(`[UploadService] Document not found for heartbeat: ${analysisId}. Aborting.`);
                return;
            }
            if (doc.status === "completed" || doc.status === "failed") {
                console.warn(`[UploadService] Job marked as completed or failed: ${analysisId}. Aborting.`);
                return;
            }

            const timeSinceActive = Date.now() - new Date(doc.lastActiveAt).getTime();
            if (timeSinceActive > 30000) {
                console.warn(`[UploadService] Client heartbeat timed out (${timeSinceActive}ms). Setting to failed.`);
                await AnalysisRepository.setFailed(analysisId);
                return;
            }

            const sectionText = sections[i];
            let targetLangSummary;

            const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
            if (geminiKey && process.env.JEST_WORKER_ID === undefined) {
                targetLangSummary = await simplifyAndTranslateWithGemini(sectionText, lang);
            } else {
                const englishSummary = await summarizeSection(sectionText);
                targetLangSummary = await translate(englishSummary, "en", lang);
            }

            const terms = extractJargon(sectionText);
            let sectionTerms = [];
            for (const term of terms) {
                if (!mainGlossary[term]) {
                    const def = await lookupDefinition(term);
                    if (def) mainGlossary[term] = def;
                    if (!def && !Object.prototype.hasOwnProperty.call(mainGlossary, term)) {
                        mainGlossary[term] = null;
                    }
                }

                if (mainGlossary[term]) {
                    sectionTerms.push({ term, definition: mainGlossary[term] });
                }
            }

            const sectionData = {
                original: sectionText,
                summary: targetLangSummary,
                legalTerms: sectionTerms,
            };

            await AnalysisRepository.pushSection(analysisId, sectionData, mainGlossary);
        }

        // Analyze legal risks/redlines using Gemini
        const risks = await analyzeRisksWithGemini(text);

        await AnalysisRepository.setCompleted(analysisId, mainGlossary, risks);
        console.log(`[UploadService] Background processing completed for: ${analysisId}`);
    } catch (err) {
        console.error(`[UploadService] Background processing failed:`, err);
        await AnalysisRepository.setFailed(analysisId);
    }
}

async function handleUpload(req, res) {
    try {
        const user = await getUserFromToken(req);
        if (!user) return res.status(401).json({ error: "Invalid Supabase token" });
        const userId = user.id;
        const username = user.user_metadata?.first_name ||
                         user.user_metadata?.full_name?.split(" ")[0] ||
                         user.email?.split("@")[0] ||
                         "User";

        const lang = req.query.lang || "en";
        if (!req.file) return res.status(400).json({ error: "No file provided." });

        const text = await extractTextFromFile(req.file);
        if (!text) return res.status(400).json({ error: "File contains no readable text." });

        const detectedLang = await detectLanguage(text);

        const newAnalysis = await AnalysisRepository.create({
            userId,
            username,
            filename: req.file.originalname,
            status: "processing",
            mimeType: req.file.mimetype,
            inputLang: detectedLang,
            outputLang: lang,
            sections: [],
            glossary: {},
            risks: [],
            lastActiveAt: new Date(),
        });

        // Respond to client immediately with 200 OK and the analysis ID
        res.status(200).json({
            analysisId: newAnalysis._id,
            status: "processing",
        });

        // Start background contract analysis
        processContractInBackground(newAnalysis._id, text, lang).catch((err) => {
            console.error("[UploadService] Uncaught background process error:", err);
        });

    } catch (err) {
        console.error(`[UploadService] Upload handling failed: ${err.message}`);
        if (!res.headersSent) {
            res.status(500).json({ error: "Upload failed" });
        }
    }
}

module.exports = { handleUpload };

