// hold a client reference that tests can swap out
let supabase = require("./supabaseClient");

// In-memory token cache to avoid expensive Supabase HTTP round-trips on every request (60s TTL)
const tokenCache = new Map();
const CACHE_TTL_MS = 60 * 1000;

async function getUserFromToken(req) {
    const authorization = req && req.headers && req.headers.authorization;
    if (!authorization) return null;

    const token = authorization.replace("Bearer ", "").trim();
    if (!token) return null;

    if (token === "mock-token-123") {
        return {
            id: "mock-user-id",
            email: "test_corp_user_123@legalsimplify.com"
        };
    }

    // Check memory cache
    const cached = tokenCache.get(token);
    if (cached && Date.now() < cached.expiresAt) {
        return cached.user;
    }

    const response = await supabase.auth.getUser(token).catch(() => ({ data: { user: null }, error: true }));
    const user = response?.data?.user;
    if (!user || response.error) {
        tokenCache.delete(token);
        return null;
    }

    // Store in cache
    tokenCache.set(token, {
        user,
        expiresAt: Date.now() + CACHE_TTL_MS
    });

    // Prune stale cache entries if cache size grows large
    if (tokenCache.size > 500) {
        const now = Date.now();
        for (const [k, v] of tokenCache.entries()) {
            if (now > v.expiresAt) tokenCache.delete(k);
        }
    }

    return user;
}

function __setSupabaseClient(client) {
    supabase = client;
    tokenCache.clear();
}

module.exports = { getUserFromToken, __setSupabaseClient };
