// src/hooks/use-Auth.ts

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient"; // Ensure the path is correct
import { Session } from "@supabase/supabase-js";

export function useAuth() {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // ✅ 1. Check the current session immediately
        supabase.auth.getSession().then(({ data }) => {
            setSession(data.session);
            setLoading(false);
        });
        // The onAuthStateChange listener returns the session on initial load,
        // as well as any future auth events. This is all we need.
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setLoading(false); // We now know the auth state, so we're done loading.
        });

        // Cleanup the listener when the component unmounts
        return () => {
            subscription?.unsubscribe();
        };
    }, []); // The empty array ensures this effect runs only once

    return { session, user: session?.user ?? null, loading };
}
