import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL, assertPublicEnv } from "./env";

/**
 * Request-scoped client acting as the signed-in user. Every query made
 * with it is filtered by row-level security, so it is the one used to
 * check whether a user may see a submission.
 */
export function createClient() {
    assertPublicEnv();
    const cookieStore = cookies();
    return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
                } catch {
                    // Called from a Server Component, where cookies are read-only.
                    // The middleware refreshes the session, so this is safe to ignore.
                }
            },
        },
    });
}
