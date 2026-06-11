const Analysis = require("../../models/Analysis");

async function create(data) {
    return Analysis.create(data);
}

async function pushSection(analysisId, sectionData) {
    return Analysis.updateOne({ _id: analysisId }, { $push: { sections: sectionData } });
}

async function setCompleted(analysisId, glossary) {
    return Analysis.updateOne({ _id: analysisId }, { $set: { status: "completed", glossary } });
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

async function getById(id) {
    return Analysis.findById(id);
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
    getById,
    deleteOne,
};

