import "server-only";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

/**
 * Service-role client. Bypasses row-level security, so it must only be
 * used AFTER the caller's identity and permissions have been checked
 * (see src/lib/auth.ts). `server-only` turns an accidental import from a
 * client component into a build error.
 */
export function createServiceClient() {
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !key) {
        throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY — see .env.example");
    }
    return createClient(SUPABASE_URL, key, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
}
