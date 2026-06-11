const { LEGAL_DICTIONARY } = require("../../../shared/glossary/glossaryData");
const {
    extractTextFromFile,
    splitIntoSections,
    detectLanguage,
    translate,
    summarizeSection,
    extractJargon,
    lookupDefinition,
} = require("../../../shared/ai/processing");

const AnalysisRepository = require("../../../infrastructure/repositories/AnalysisRepository");
const { getUserFromToken } = require("../../../utils/auth");

async function handleUpload(req, res) {
    let analysisId = null;
    try {
        const user = await getUserFromToken(req);
        if (!user) return res.status(401).json({ error: "Invalid token" });
        const userId = user.id;

        const lang = req.query.lang || "en";
        if (!req.file) return res.status(400).json({ error: "No file provided." });

        const text = await extractTextFromFile(req.file);
        if (!text) return res.status(400).json({ error: "File contains no readable text." });

        const detectedLang = await detectLanguage(text);

        const newAnalysis = await AnalysisRepository.create({
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

        let isRequestCancelled = false;
        req.on("close", () => {
            isRequestCancelled = true;
        });

        res.setHeader("Content-Type", "text/event-stream");
        res.flushHeaders();
        res.write(
            `data: ${JSON.stringify({ totalSections: sections.length, analysisId })}\n\n`
        );

        let mainGlossary = {};

        for (let i = 0; i < sections.length; i++) {
            if (isRequestCancelled) break;

            const sectionText = sections[i];
            const englishSummary = await summarizeSection(sectionText);
            const targetLangSummary = await translate(englishSummary, "en", lang);

            const terms = extractJargon(sectionText);
            let sectionTerms = [];
            for (const term of terms) {
                if (!mainGlossary[term]) {
                    const def = await lookupDefinition(term);
                    if (def) mainGlossary[term] = def;
                    if (!def && !Object.prototype.hasOwnProperty.call(mainGlossary, term)) {
                        mainGlossary[term] = null;
                    }
                    if (!Object.prototype.hasOwnProperty.call(LEGAL_DICTIONARY, term)) {
                        await new Promise((r) => setTimeout(r, 100));
                    }
                }

                if (mainGlossary[term]) sectionTerms.push({ term, definition: mainGlossary[term] });
            }

            const sectionData = {
                original: sectionText,
                summary: targetLangSummary,
                legalTerms: sectionTerms,
            };

            await AnalysisRepository.pushSection(analysisId, sectionData);
            res.write(
                `data: ${JSON.stringify({ section: i + 1, ...sectionData })}\n\n`
            );
        }

        await AnalysisRepository.setCompleted(analysisId, mainGlossary);
        res.write(`data: {"done": true}\n\n`);
        res.end();
    } catch (err) {
        if (analysisId) {
            await AnalysisRepository.setFailed(analysisId);
        }
        if (!res.headersSent) {
            res.status(500).json({ error: "Processing failed" });
        } else {
            res.end();
        }
    }
}

module.exports = { handleUpload };

