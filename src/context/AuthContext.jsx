// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient"; // Make sure path is correct

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true); // 1. Add loading state

    useEffect(() => {
        // 2. Use the simplified, correct listener to avoid race conditions
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setLoading(false); // Auth check is now complete
        });

        // 3. Add the cleanup function to prevent memory leaks
        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    // Provide the auth functions, session, and loading state to the app
    const value = {
        signUp: (email, password) => supabase.auth.signUp({ email, password }),
        signIn: (email, password) =>
            supabase.auth.signInWithPassword({ email, password }),
        signOut: () => supabase.auth.signOut(),
        session,
        loading, // 4. Make the loading state available
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};

// This is a helper hook to easily use the context
export const UserAuth = () => {
    return useContext(AuthContext);
};
