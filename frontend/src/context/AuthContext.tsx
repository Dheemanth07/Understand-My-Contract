import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "../lib/supabaseClient";
import { Session, AuthResponse, AuthError } from "@supabase/supabase-js";

interface AuthContextType {
    signUp: (email: string, password: string) => Promise<AuthResponse>;
    signIn: (email: string, password: string) => Promise<AuthResponse>;
    signOut: () => Promise<{ error: AuthError | null }>;
    session: Session | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getCachedSession = (): Session | null => {
    try {
        const key = Object.keys(localStorage).find((k) => k.startsWith("sb-") && k.endsWith("-auth-token"));
        if (key) {
            const raw = localStorage.getItem(key);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && (parsed.access_token || parsed.currentSession?.access_token)) {
                    return parsed.currentSession || parsed;
                }
            }
        }
    } catch (e) {
        // Ignore parse error
    }
    return null;
};

export const AuthContextProvider = ({ children }: { children: ReactNode }) => {
    const [session, setSession] = useState<Session | null>(() => getCachedSession());
    const [loading, setLoading] = useState<boolean>(() => !getCachedSession());

    useEffect(() => {
        // Verify with Supabase client
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setLoading(false);

            // Clean up Google OAuth hash from URL and history entry so pressing Back in browser doesn't return to OAuth state
            if (session && window.location.hash && window.location.hash.includes("access_token")) {
                window.history.replaceState(null, "", window.location.pathname + window.location.search);
            }
        });

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    const value: AuthContextType = {
        signUp: (email, password) => supabase.auth.signUp({ email, password }),
        signIn: (email, password) =>
            supabase.auth.signInWithPassword({ email, password }),
        signOut: () => supabase.auth.signOut(),
        session,
        loading,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};

export const UserAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("UserAuth must be used within an AuthContextProvider");
    }
    return context;
};
