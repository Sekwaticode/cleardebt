import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Landing point for links in Supabase auth emails (sign-up confirmation,
 * password recovery). Exchanges the one-time code for a session cookie.
 */
export async function GET(request: Request) {
    const url = new URL(request.url);
    const next = safeNext(url.searchParams.get("next"), "/forms");
    const code = url.searchParams.get("code");
    const tokenHash = url.searchParams.get("token_hash");
    const type = url.searchParams.get("type") as EmailOtpType | null;

    const supabase = createClient();
    let ok = false;

    if (code) {
        ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
    } else if (tokenHash && type) {
        ok = !(await supabase.auth.verifyOtp({ token_hash: tokenHash, type })).error;
    }

    if (ok) return NextResponse.redirect(new URL(next, url.origin));

    const fail = new URL("/forms/login", url.origin);
    fail.searchParams.set("error", "link");
    return NextResponse.redirect(fail);
}
