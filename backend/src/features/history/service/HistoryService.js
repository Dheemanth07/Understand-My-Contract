const AnalysisRepository = require("../../../infrastructure/repositories/AnalysisRepository");
const { getUserFromToken } = require("../../../utils/auth");
const supabase = require("../../../utils/supabaseClient");
const { callGemini } = require("../../../services/processing");

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
Answer the user's question accurately based ONLY on the provided contract text. Be helpful, clear, and refer to specific sections if they are relevant.
If the answer is not found in the contract, explain that clearly and advise them based on standard legal practices, but clarify that it is not in the text.

Contract text:
"${contractText.substring(0, 20000)}"

User question:
"${message}"`;

        const reply = await callGemini(prompt);
        if (reply) {
            return res.json({ reply });
        }

        return res.json({
            reply: `I was unable to reach the AI engine to review this contract right now. However, looking at the contract name "${doc.filename}", make sure to review the document for specific clauses related to your question.`
        });
    } catch (err) {
        console.error("Chat endpoint error:", err);
        res.status(500).json({ error: "Chat failed" });
    }
}

async function getMergedGlossary(req, res) {
    try {
        const user = await getUserFromToken(req);
        if (!user) return res.status(401).json({ error: "Authentication required" });

        const docs = await AnalysisRepository.getUserGlossaries(user.id);
        const merged = {};
        for (const doc of docs) {
            if (doc.glossary) {
                Object.entries(doc.glossary).forEach(([term, definition]) => {
                    if (definition && definition !== '(Definition not found)') {
                        merged[term] = definition;
                    }
                });
            }
        }
        res.json({ glossary: merged });
    } catch (err) {
        console.error("Failed to fetch merged glossary:", err);
        res.status(500).json({ error: "Failed to fetch glossary" });
    }
}

module.exports = { list, getById, deleteById, chat, getMergedGlossary };

