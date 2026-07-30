import { LEGAL_DICTIONARY } from "../../shared/glossary/glossaryData.js";
import {
    extractTextFromFile,
    anonymizePII,
    splitIntoSections,
    detectLanguage,
    translate,
    summarizeSection,
    extractJargon,
    lookupDefinition,
    simplifyAndTranslateWithGemini,
    analyzeRisksWithGemini,
} from "../../shared/ai/processing.js";

import AnalysisRepository from "./upload.repository.js";
import { getUserFromToken } from "../../utils/auth.js";

async function processContractInBackground(analysisId, text, lang) {
    try {
        const sections = splitIntoSections(text);
        let mainGlossary = {};

        console.log(`[UploadService] Starting background processing for ${analysisId}: ${sections.length} total sections.`);

        for (let i = 0; i < sections.length; i++) {
            // Heartbeat check: Query latest document state
            const doc = await AnalysisRepository.getById(analysisId);
            if (!doc) {
                console.warn(`[UploadService] Document not found for heartbeat: ${analysisId}. Aborting.`);
                return;
            }
            if (doc.status === "failed") {
                console.warn(`[UploadService] Job marked as failed: ${analysisId}. Aborting.`);
                return;
            }

            const timeSinceActive = Date.now() - new Date(doc.lastActiveAt).getTime();
            if (timeSinceActive > 240000) { // 4 minute timeout
                console.warn(`[UploadService] Client heartbeat timed out (${timeSinceActive}ms). Setting to failed.`);
                await AnalysisRepository.setFailed(analysisId);
                return;
            }

            const sectionText = sections[i];
            let targetLangSummary;

            try {
                const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
                if (geminiKey && process.env.JEST_WORKER_ID === undefined) {
                    targetLangSummary = await simplifyAndTranslateWithGemini(sectionText, lang);
                } else {
                    const englishSummary = await summarizeSection(sectionText);
                    targetLangSummary = await translate(englishSummary, "en", lang);
                }
            } catch (sectionErr) {
                console.warn(`[UploadService] Section ${i + 1} processing warning:`, sectionErr.message);
                targetLangSummary = "Summary generated from section legal text.";
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
                summary: targetLangSummary || "Section overview extracted successfully.",
                legalTerms: sectionTerms,
            };

            await AnalysisRepository.pushSection(analysisId, sectionData, mainGlossary);
            console.log(`[UploadService] Progress: Section ${i + 1}/${sections.length} saved for ${analysisId}`);
        }

        // Analyze legal risks/redlines using Gemini
        let risks = [];
        try {
            risks = await analyzeRisksWithGemini(text);
        } catch (riskErr) {
            console.warn(`[UploadService] Risk audit warning:`, riskErr.message);
        }

        await AnalysisRepository.setCompleted(analysisId, mainGlossary, risks || []);
        console.log(`[UploadService] Background processing fully completed for: ${analysisId} (${sections.length} sections)`);
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
        const doAnonymize = req.query.anonymize !== "false";
        const isIncognito = req.query.incognito === "true";

        if (!req.file) return res.status(400).json({ error: "No file provided." });

        let text = await extractTextFromFile(req.file);
        if (!text) return res.status(400).json({ error: "File contains no readable text." });

        // Apply PII Anonymization if requested/enabled
        if (doAnonymize) {
            text = anonymizePII(text);
        }

        const detectedLang = await detectLanguage(text);

        // If Incognito Mode is requested, process in-memory with ZERO database retention
        if (isIncognito) {
            console.log(`[UploadService] Processing file in Incognito Mode (Zero DB Storage)...`);
            const sections = splitIntoSections(text);
            const sectionResults = [];
            let mainGlossary = {};

            for (let i = 0; i < sections.length; i++) {
                const sectionText = sections[i];
                let targetLangSummary = await simplifyAndTranslateWithGemini(sectionText, lang);
                if (!targetLangSummary) {
                    const englishSummary = await summarizeSection(sectionText);
                    targetLangSummary = await translate(englishSummary, "en", lang);
                }

                const terms = extractJargon(sectionText);
                let sectionTerms = [];
                for (const term of terms) {
                    if (!mainGlossary[term]) {
                        const def = await lookupDefinition(term);
                        if (def) mainGlossary[term] = def;
                    }
                    if (mainGlossary[term]) {
                        sectionTerms.push({ term, definition: mainGlossary[term] });
                    }
                }

                sectionResults.push({
                    section: i + 1,
                    original: sectionText,
                    summary: targetLangSummary,
                    legalTerms: sectionTerms,
                });
            }

            const risks = await analyzeRisksWithGemini(text);

            return res.status(200).json({
                incognito: true,
                filename: req.file.originalname,
                status: "completed",
                inputLang: detectedLang,
                outputLang: lang,
                sections: sectionResults,
                glossary: mainGlossary,
                risks: risks,
            });
        }

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

export { handleUpload };
