const express = require("express");
const router = express.Router();
const Analysis = require("../models/Analysis");
const { getUserFromToken } = require("../utils/auth");
const supabase = require("../utils/supabaseClient");

router.get("/", async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user) return res.status(401).json({ error: "Authentication required" });
        const docs = await Analysis.find({ userId: user.id }, { filename: 1, createdAt: 1, _id: 1 })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();
        res.json(docs.map((doc) => ({ id: doc._id, filename: doc.filename, createdAt: doc.createdAt })));
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch history" });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user) return res.status(401).json({ error: "Authentication required" });
        const { id } = req.params;
        const doc = await Analysis.findById(id).lean();
        if (!doc || doc.userId !== user.id) return res.status(404).json({ error: "Document not found or access denied" });
        res.json(doc);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch analysis" });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const user = await getUserFromToken(req);
        if (!user) return res.status(401).json({ error: "Authentication required" });
        const { id } = req.params;
        const result = await Analysis.findOneAndDelete({ _id: id, userId: user.id });
        if (!result) return res.status(404).json({ error: "Document not found or access denied" });
        await supabase.from("uploads").delete().match({ file_name: result.filename, user_id: user.id });
        res.status(200).json({ message: "Document deleted successfully" });
    } catch (e) {
        res.status(500).json({ error: "Failed to delete document" });
    }
});

module.exports = router;
