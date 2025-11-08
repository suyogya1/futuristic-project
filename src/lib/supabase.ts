// src/lib/supabase.js
import { createClient } from "@supabase/supabase-js";

// ✅ Create Supabase client using environment variables
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: { persistSession: false },
  }
);
