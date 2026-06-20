const Analysis = require("../../models/Analysis");

async function create(data) {
    return Analysis.create(data);
}

async function pushSection(analysisId, sectionData) {
    return Analysis.updateOne({ _id: analysisId }, { $push: { sections: sectionData } });
}

async function setCompleted(analysisId, glossary, risks = []) {
    return Analysis.updateOne({ _id: analysisId }, { $set: { status: "completed", glossary, risks } });
}

async function setFailed(analysisId) {
    return Analysis.updateOne({ _id: analysisId }, { $set: { status: "failed" } });
}

async function listUserHistory(userId) {
    const historyQuery = Analysis.find({ userId }, { filename: 1, createdAt: 1, _id: 1 });
    if (typeof historyQuery.sort === "function") {
        const docs = await historyQuery.sort({ createdAt: -1 }).limit(50).lean();
        return docs;
    }
    return historyQuery;
}

async function listUserHistoryPaginated(userId, limit = 5, cursor = null) {
    const filter = { userId };
    if (cursor) {
        filter.createdAt = { $lt: new Date(cursor) };
    }
    const docs = await Analysis.find(filter, { filename: 1, createdAt: 1, _id: 1 })
        .sort({ createdAt: -1 })
        .limit(limit + 1)
        .lean();

    const hasMore = docs.length > limit;
    const items = hasMore ? docs.slice(0, limit) : docs;
    const nextCursor = hasMore ? items[items.length - 1].createdAt.toISOString() : null;
    return { items, nextCursor, hasMore };
}

async function updateLastActive(analysisId) {
    return Analysis.updateOne({ _id: analysisId }, { $set: { lastActiveAt: new Date() } });
}

async function getUserGlossaries(userId) {
    return Analysis.find({ userId, status: "completed" }, { glossary: 1 }).lean();
}

async function getById(id) {
    return Analysis.findById(id).lean();
}

async function deleteOne(filter) {
    return Analysis.findOneAndDelete(filter);
}

module.exports = {
    create,
    pushSection,
    setCompleted,
    setFailed,
    listUserHistory,
    listUserHistoryPaginated,
    updateLastActive,
    getUserGlossaries,
    getById,
    deleteOne,
};

