"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, assertPublicEnv } from "./env";

/** Browser client — used only for sign-in / sign-up / sign-out. */
export function createClient() {
    assertPublicEnv();
    return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
