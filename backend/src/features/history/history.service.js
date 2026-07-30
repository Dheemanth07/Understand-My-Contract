import AnalysisRepository from "./history.repository.js";
import { getUserFromToken } from "../../utils/auth.js";
import supabase from "../../utils/supabaseClient.js";
import { callAI, analyzeRisksWithGemini } from "../../services/processing.js";

async function list(req, res) {
    try {
        const user = await getUserFromToken(req);
        if (!user) return res.status(401).json({ error: "Authentication required" });

        const { limit, cursor } = req.query;

        // Paginated path — used by the /history page
        if (limit !== undefined) {
            const pageSize = Math.min(parseInt(limit, 10) || 5, 50);
            const result = await AnalysisRepository.listUserHistoryPaginated(
                user.id,
                pageSize,
                cursor || null
            );
            return res.json({
                items: result.items.map((doc) => ({
                    id: doc._id,
                    filename: doc.filename,
                    createdAt: doc.createdAt,
                })),
                nextCursor: result.nextCursor,
                hasMore: result.hasMore,
            });
        }

        // Legacy path — Dashboard sidebar + all existing tests
        const docs = await AnalysisRepository.listUserHistory(user.id);
        res.json(docs.map((doc) => ({ id: doc._id, filename: doc.filename, createdAt: doc.createdAt })));
    } catch {
        res.status(500).json({ error: "Failed to fetch history" });
    }
}

async function getActiveProcessing(req, res) {
    try {
        const user = await getUserFromToken(req);
        if (!user) return res.status(401).json({ error: "Authentication required" });

        const doc = await AnalysisRepository.findActiveProcessingDoc(user.id);
        if (!doc) return res.json(null);

        if (!doc.risks || doc.risks.length === 0) {
            doc.risks = await analyzeRisksWithGemini(doc.text || "");
        }

        await AnalysisRepository.updateLastActive(doc._id);
        return res.json(doc);
    } catch {
        res.status(500).json({ error: "Failed to fetch active document" });
    }
}

async function getById(req, res) {
    try {
        const user = await getUserFromToken(req);
        if (!user) return res.status(401).json({ error: "Authentication required" });

        const { id } = req.params;
        const doc = await AnalysisRepository.getById(id);
        if (!doc || doc.userId !== user.id) return res.status(404).json({ error: "Document not found or access denied" });

        if (doc.status === "processing") {
            await AnalysisRepository.updateLastActive(id);
        }

        // ONLY compute risks if doc is ALREADY marked as completed by worker but risks are missing
        if (doc.status === "completed" && (!doc.risks || doc.risks.length === 0)) {
            doc.risks = await analyzeRisksWithGemini(doc.sections.map(s => s.original).join("\n\n") || "");
            await AnalysisRepository.setCompleted(id, doc.glossary || {}, doc.risks);
        }

        res.json(doc);
    } catch {
        res.status(500).json({ error: "Failed to fetch analysis" });
    }
}

async function deleteById(req, res) {
    try {
        const user = await getUserFromToken(req);
        if (!user) return res.status(401).json({ error: "Authentication required" });

        const { id } = req.params;
        const result = await AnalysisRepository.deleteOne({ _id: id, userId: user.id });
        if (!result) return res.status(404).json({ error: "Document not found or access denied" });

        try {
            await supabase.from("uploads").delete().match({ file_name: result.filename, user_id: user.id });
        } catch (supabaseErr) {
            console.warn(" Failed to delete from Supabase uploads table:", supabaseErr.message);
        }

        res.status(200).json({ message: "Document deleted successfully" });
    } catch {
        res.status(500).json({ error: "Failed to delete document" });
    }
}

async function chat(req, res) {
    try {
        const user = await getUserFromToken(req);
        if (!user) return res.status(401).json({ error: "Authentication required" });

        const { id } = req.params;
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: "Message is required" });

        const doc = await AnalysisRepository.getById(id);
        if (!doc || doc.userId !== user.id) return res.status(404).json({ error: "Document not found or access denied" });

        const contractText = doc.sections.map(s => s.original).join("\n\n");
        const prompt = `You are an AI legal assistant. You are answering a question about a specific legal contract that the user has uploaded.
Answer the user's question accurately based ONLY on the provided contract text. Be helpful, clear, and refer to specific sections if relevant.
IMPORTANT: Use plain text only. Do NOT use markdown asterisks (**) or (*) for bold or italic. Use numbered lists and plain headings instead.
If the answer is not found in the contract, explain that clearly and advise them based on standard legal practices.

Contract text:
"${contractText.substring(0, 20000)}"

User question:
"${message}"`;

        const reply = await callAI(prompt, doc.filename);
        return res.json({ reply });
    } catch (err) {
        console.error("Chat endpoint error:", err);
        res.status(500).json({ error: "Chat failed" });
    }
}

async function generalChat(req, res) {
    try {
        const user = await getUserFromToken(req);
        if (!user) return res.status(401).json({ error: "Authentication required" });

        const { message, contextText, filename } = req.body;
        if (!message) return res.status(400).json({ error: "Message is required" });

        let prompt = "";
        if (contextText && contextText.trim().length > 0) {
            prompt = `You are an AI legal assistant. You are answering a question about a contract named "${filename || "Document"}".
Answer the user's question accurately based on the provided contract text. Be helpful, clear, and refer to specific clauses if relevant.
IMPORTANT: Use plain text only. Do NOT use markdown asterisks (**) or (*) for bold or italic. Use numbered lists and plain section headings instead.

Contract text:
"${contextText.substring(0, 20000)}"

User question:
"${message}"`;
        } else {
            prompt = `You are LegalSimplify AI, an expert corporate legal assistant. Answer the user's question clearly, accurately, and professionally.
IMPORTANT: Use plain text only. Do NOT use markdown asterisks (**) or (*) for bold or italic. Use numbered lists and plain section headings instead.

User question:
"${message}"`;
        }

        const reply = await callAI(prompt, filename);
        return res.json({ reply });
    } catch (err) {
        console.error("General chat endpoint error:", err);
        res.status(500).json({ error: "Chat failed" });
    }
}

async function getMergedGlossary(req, res) {
    try {
        const user = await getUserFromToken(req);
        if (!user) return res.status(401).json({ error: "Authentication required" });

        const docs = await AnalysisRepository.getUserGlossaries(user.id);
        const merged = {};
        const termMap = new Map(); // lowercaseTerm -> { originalTerm, definition }

        for (const doc of docs) {
            if (doc.glossary) {
                Object.entries(doc.glossary).forEach(([term, definition]) => {
                    if (definition && definition !== '(Definition not found)') {
                        const trimmed = term.trim();
                        const lower = trimmed.toLowerCase();

                        if (!termMap.has(lower)) {
                            termMap.set(lower, { term: trimmed, definition });
                        } else {
                            // If the existing term is all-uppercase (e.g. REGULATION) but the new one is not, prefer the new one's casing
                            const existing = termMap.get(lower);
                            const isExistingAllUpper = existing.term === existing.term.toUpperCase();
                            const isNewAllUpper = trimmed === trimmed.toUpperCase();
                            if (isExistingAllUpper && !isNewAllUpper) {
                                termMap.set(lower, { term: trimmed, definition });
                            }
                        }
                    }
                });
            }
        }

        for (const { term, definition } of termMap.values()) {
            merged[term] = definition;
        }

        res.json({ glossary: merged });
    } catch (err) {
        console.error("Failed to fetch merged glossary:", err);
        res.status(500).json({ error: "Failed to fetch glossary" });
    }
}

async function stop(req, res) {
    try {
        const user = await getUserFromToken(req);
        if (!user) return res.status(401).json({ error: "Authentication required" });

        const { id } = req.params;
        const doc = await AnalysisRepository.getById(id);
        if (!doc || doc.userId !== user.id) return res.status(404).json({ error: "Document not found or access denied" });

        if (doc.status === "processing") {
            await AnalysisRepository.setCompleted(id, doc.glossary || {}, doc.risks || []);
        }

        res.status(200).json({ message: "Document processing stopped, partial analysis saved." });
    } catch (err) {
        console.error("Stop processing error:", err);
        res.status(500).json({ error: "Failed to stop processing" });
    }
}

export { list, getActiveProcessing, getById, deleteById, chat, generalChat, getMergedGlossary, stop };
