function getStorageMode() {
    // local | mongo | supabase
    return process.env.STORAGE_DRIVER || "supabase";
}

module.exports = { getStorageMode };

