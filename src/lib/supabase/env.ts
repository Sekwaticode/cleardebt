/* Public Supabase settings. The anon/publishable key is designed to be
   public — every table is protected by row-level security. The
   service-role key lives only in src/lib/supabase/admin.ts. */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function assertPublicEnv() {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error(
            "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — see .env.example",
        );
    }
}
