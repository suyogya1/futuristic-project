import { createClient } from "@supabase/supabase-js";

console.log("🔍 VITE_SUPABASE_URL =", import.meta.env.VITE_SUPABASE_URL);
console.log("🔍 VITE_SUPABASE_ANON_KEY =", import.meta.env.VITE_SUPABASE_ANON_KEY ? "Loaded ✅" : "Missing ❌");

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase environment variables missing! Check your .env file and restart.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
