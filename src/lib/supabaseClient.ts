import { createClient } from "@supabase/supabase-js";

export function createSupabaseClient(url: string, key: string) {
	return createClient(url, key);
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);
