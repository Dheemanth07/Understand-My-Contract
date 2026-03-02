// hold a client reference that tests can swap out
let supabase = require("./supabaseClient");

async function getUserFromToken(req) {
    const authorization = req && req.headers && req.headers.authorization;
    if (!authorization) return null;

    const token = authorization.replace("Bearer ", "").trim();
    const response = await supabase.auth.getUser(token).catch(() => ({ data: { user: null }, error: true }));
    const user = response?.data?.user;
    if (!user || response.error) return null;
    return user;
}

function __setSupabaseClient(client) {
    supabase = client;
}

module.exports = { getUserFromToken, __setSupabaseClient };
