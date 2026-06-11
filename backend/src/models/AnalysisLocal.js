const { randomUUID } = require("crypto");

// Simple in-memory storage used to run the project without Supabase.
// Keys are analysisId.
const store = new Map();

function nowIso() {
    return new Date().toISOString();
}

async function create(data) {
    const id = randomUUID();
    const doc = {
        _id: id,
        id,
        userId: data.userId,
        status: data.status || "processing",
        filename: data.filename,
        mimeType: data.mimeType,
        inputLang: data.inputLang,
        outputLang: data.outputLang,
        sections: data.sections || [],
        glossary: data.glossary || {},
        createdAt: nowIso(),
        updatedAt: nowIso(),
    };
    store.set(id, doc);
    return doc;
}

async function updateOne(filter, update) {
    const analysisId = filter?._id;
    const current = store.get(analysisId);
    if (!current) return { matchedCount: 0, modifiedCount: 0 };

    if (update.$set) {
        Object.assign(current, update.$set);
    }
    if (update.$push && update.$push.sections) {
        current.sections = [...(current.sections || []), update.$push.sections];
    }

    current.updatedAt = nowIso();
    store.set(analysisId, current);
    return { matchedCount: 1, modifiedCount: 1 };
}

function find(filter = {}) {
    const userId = filter.userId;

    const result = [...store.values()]
        .filter((d) => (userId ? d.userId === userId : true))
        .map((d) => ({ ...d }));

    return {
        sort(spec) {
            const [[field, direction]] = Object.entries(spec || {});
            const dir = direction === -1 ? -1 : 1;
            result.sort((a, b) => {
                const av = a[field];
                const bv = b[field];
                return av > bv ? dir : av < bv ? -dir : 0;
            });
            return this;
        },
        limit(n) {
            result.splice(n);
            return this;
        },
        async lean() {
            return result.map((d) => ({
                _id: d._id,
                id: d.id,
                userId: d.userId,
                filename: d.filename,
                status: d.status,
                mimeType: d.mimeType,
                inputLang: d.inputLang,
                outputLang: d.outputLang,
                sections: d.sections,
                glossary: d.glossary,
                createdAt: d.createdAt,
                updatedAt: d.updatedAt,
            }));
        },
        then(resolve, reject) {
            return this.lean().then(resolve, reject);
        },
    };
}

function findById(id) {
    const doc = store.get(id);
    return {
        lean: async () => (doc ? { ...doc } : null),
        then: async (resolve, reject) => {
            try {
                resolve(doc ? { ...doc } : null);
            } catch (e) {
                reject(e);
            }
        },
    };
}

async function findOneAndDelete(filter) {
    const analysisId = filter?._id;
    const doc = store.get(analysisId);
    if (!doc) return null;
    if (filter.userId && doc.userId !== filter.userId) return null;
    store.delete(analysisId);
    return { ...doc };
}

module.exports = {
    create,
    updateOne,
    find,
    findById,
    findOneAndDelete,
    __store: store,
};

