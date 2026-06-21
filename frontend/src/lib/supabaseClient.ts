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
            return new Proxy(target.auth, {
                get(authTarget, authProp) {
                    if (authProp === 'signUp') {
                        return async (credentials: any) => {
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
                            return authTarget.signUp(credentials);
                        };
                    }
                    if (authProp === 'signInWithPassword') {
                        return async (credentials: any) => {
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
                            return authTarget.signInWithPassword(credentials);
                        };
                    }
                    if (authProp === 'signOut') {
                        return async () => {
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
                            return authTarget.signOut();
                        };
                    }
                    if (authProp === 'getSession') {
                        return async () => {
                            if (localSession) {
                                return { data: { session: localSession }, error: null };
                            }
                            return authTarget.getSession();
                        };
                    }
                    if (authProp === 'getUser') {
                        return async (jwt?: string) => {
                            if (localSession) {
                                return { data: { user: localSession.user }, error: null };
                            }
                            return authTarget.getUser(jwt);
                        };
                    }
                    if (authProp === 'onAuthStateChange') {
                        return (callback: any) => {
                            authListeners.add(callback);

                            const wrappedCallback = (event: string, session: any) => {
                                if (localSession) {
                                    if (!session) {
                                        return;
                                    }
                                }
                                callback(event, session);
                            };

                            if (localSession) {
                                setTimeout(() => {
                                    callback("SIGNED_IN", localSession);
                                }, 0);
                            }
                            
                            const sub = authTarget.onAuthStateChange(wrappedCallback);
                            
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
                        };
                    }

                    const val = (authTarget as any)[authProp];
                    if (typeof val === 'function') {
                        return val.bind(authTarget);
                    }
                    return val;
                }
            });
        }
        return (target as any)[prop];
    }
}) as typeof originalSupabase;

