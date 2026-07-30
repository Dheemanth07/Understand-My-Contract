import app from "./src/app.js";
import Analysis from "./src/models/Analysis.js";
import * as processing from "./src/services/processing.js";
import { getUserFromToken } from "./src/utils/auth.js";
import supabase from "./src/utils/supabaseClient.js";

const {
    extractTextFromFile,
    anonymizePII,
    splitIntoSections,
    detectLanguage,
    translate,
    summarizeSection,
    extractJargon,
    lookupDefinition,
    simplifyAndTranslateWithGemini,
    callGemini,
    callGroq,
    callAI,
    analyzeRisksWithGemini,
} = processing;

export {
    app,
    Analysis,
    extractTextFromFile,
    anonymizePII,
    splitIntoSections,
    detectLanguage,
    translate,
    summarizeSection,
    extractJargon,
    lookupDefinition,
    simplifyAndTranslateWithGemini,
    callGemini,
    callGroq,
    callAI,
    analyzeRisksWithGemini,
    getUserFromToken,
    supabase,
};

export default {
    app,
    Analysis,
    ...processing,
    getUserFromToken,
    supabase,
};

if (process.argv[1] && process.argv[1].endsWith("server.js")) {
    import("./src/index.js");
}

