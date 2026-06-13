const AnalysisRepository = require("../../../infrastructure/repositories/AnalysisRepository");
const { getUserFromToken } = require("../../../utils/auth");
const supabase = require("../../../utils/supabaseClient");

async function list(req, res) {
    try {
        const user = await getUserFromToken(req);
        if (!user) return res.status(401).json({ error: "Authentication required" });

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
            console.warn("⚠️ Failed to delete from Supabase uploads table:", supabaseErr.message);
        }

        res.status(200).json({ message: "Document deleted successfully" });
    } catch {
        res.status(500).json({ error: "Failed to delete document" });
    }
}

module.exports = { list, getById, deleteById };

