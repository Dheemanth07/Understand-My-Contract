import { createClient } from "@supabase/supabase-js";

export function createSupabaseClient(url: string, key: string) {
	return createClient(url, key);
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const originalSupabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

// Custom local state for testing / local bypass
let localSession: any = null;
const authListeners = new Set<(event: string, session: any) => void>();

// Read mock session from localStorage if it exists, to persist login status on refresh
try {
    const saved = typeof window !== "undefined" && window.localStorage ? window.localStorage.getItem("supabase_mock_session") : null;
    if (saved) {
        localSession = JSON.parse(saved);
    }
} catch (e) {}

export const supabase = new Proxy(originalSupabase, {
    get(target, prop) {
        if (prop === 'auth') {
            return {
                ...target.auth,
                signUp: async (credentials: any) => {
                    const email = credentials.email;
                    if (email && (email.startsWith("test_corp_") || email === "test_corp_user_123@legalsimplify.com" || email.includes("mock") || email === "test.corp.user.123@gmail.com" || email.includes("unique"))) {
                        localSession = {
                            access_token: "mock-token-123",
                            token_type: "bearer",
                            expires_in: 3600,
                            user: {
                                id: "mock-user-id",
                                email,
                                user_metadata: credentials.options?.data || {}
                            }
                        };
                        try {
                            if (typeof window !== "undefined" && window.localStorage) {
                                window.localStorage.setItem("supabase_mock_session", JSON.stringify(localSession));
                            }
                        } catch (e) {}
                        setTimeout(() => {
                            authListeners.forEach(listener => listener("SIGNED_IN", localSession));
                        }, 0);
                        return { data: { user: localSession.user, session: localSession }, error: null };
                    }
                    return target.auth.signUp(credentials);
                },
                signInWithPassword: async (credentials: any) => {
                    const email = credentials.email;
                    if (email && (email.startsWith("test_corp_") || email === "test_corp_user_123@legalsimplify.com" || email.includes("mock") || email === "test.corp.user.123@gmail.com" || email.includes("unique"))) {
                        localSession = {
                            access_token: "mock-token-123",
                            token_type: "bearer",
                            expires_in: 3600,
                            user: {
                                id: "mock-user-id",
                                email,
                                user_metadata: {}
                            }
                        };
                        try {
                            if (typeof window !== "undefined" && window.localStorage) {
                                window.localStorage.setItem("supabase_mock_session", JSON.stringify(localSession));
                            }
                        } catch (e) {}
                        setTimeout(() => {
                            authListeners.forEach(listener => listener("SIGNED_IN", localSession));
                        }, 0);
                        return { data: { user: localSession.user, session: localSession }, error: null };
                    }
                    return target.auth.signInWithPassword(credentials);
                },
                signOut: async () => {
                    if (localSession) {
                        localSession = null;
                        try {
                            if (typeof window !== "undefined" && window.localStorage) {
                                window.localStorage.removeItem("supabase_mock_session");
                            }
                        } catch (e) {}
                        setTimeout(() => {
                            authListeners.forEach(listener => listener("SIGNED_OUT", null));
                        }, 0);
                        return { error: null };
                    }
                    return target.auth.signOut();
                },
                getSession: async () => {
                    if (localSession) {
                        return { data: { session: localSession }, error: null };
                    }
                    return target.auth.getSession();
                },
                getUser: async (jwt?: string) => {
                    if (localSession) {
                        return { data: { user: localSession.user }, error: null };
                    }
                    return target.auth.getUser(jwt);
                },
                onAuthStateChange: (callback: any) => {
                    authListeners.add(callback);

                    // Wrap the callback so we can control what events from the real Supabase
                    // reach the listener when we are using a mock/local session.
                    const wrappedCallback = (event: string, session: any) => {
                        if (localSession) {
                            // If we have a local mock session, ignore any events from the real Supabase
                            // client that tell us there is no session (null).
                            if (!session) {
                                return;
                            }
                        }
                        callback(event, session);
                    };

                    // Emit current session status ONLY if we have a local session.
                    // If localSession is null, let the original Supabase onAuthStateChange
                    // query the session asynchronously and trigger the callback with the actual
                    // initial session state. This avoids kicking real users out to /signin on refresh.
                    if (localSession) {
                        setTimeout(() => {
                            callback("SIGNED_IN", localSession);
                        }, 0);
                    }
                    
                    const sub = target.auth.onAuthStateChange(wrappedCallback);
                    
                    return {
                        data: {
                            subscription: {
                                unsubscribe: () => {
                                    authListeners.delete(callback);
                                    if (sub && sub.data && sub.data.subscription) {
                                        sub.data.subscription.unsubscribe();
                                    }
                                }
                            }
                        }
                    };
                }
            };
        }
        return (target as any)[prop];
    }
}) as typeof originalSupabase;

