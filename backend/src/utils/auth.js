const supabase = require("./supabaseClient");

async function getUserFromToken(req) {
    const authorization = req && req.headers && req.headers.authorization;
    if (!authorization) return null;
    const token = authorization.replace("Bearer ", "");
    const { data: { user } = {} } = await supabase.auth.getUser(token).catch(() => ({}));
    return user || null;
}

module.exports = { getUserFromToken };
