import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "./supabase/server";

export type Role = "client" | "admin";

export interface SessionContext {
    user: User;
    role: Role;
    fullName: string | null;
    /** RLS-scoped client acting as this user. */
    supabase: ReturnType<typeof createClient>;
}

/** Resolves the signed-in user and their role, or null. */
export async function getSessionContext(): Promise<SessionContext | null> {
    const supabase = createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", user.id)
        .maybeSingle();

    return {
        user,
        supabase,
        role: profile?.role === "admin" ? "admin" : "client",
        fullName: profile?.full_name ?? (user.user_metadata?.full_name as string | undefined) ?? null,
    };
}

/** For portal pages: the signed-in user, or a redirect to the portal login. */
export async function requireUserPage(next: string): Promise<SessionContext> {
    const ctx = await getSessionContext();
    if (!ctx) redirect(`/forms/login?next=${encodeURIComponent(next)}`);
    return ctx;
}

/** For admin pages: an admin, or a redirect to the admin login. */
export async function requireAdminPage(next = "/admin"): Promise<SessionContext> {
    const ctx = await getSessionContext();
    if (!ctx) redirect(`/admin/login?next=${encodeURIComponent(next)}`);
    if (ctx.role !== "admin") redirect("/admin/login?error=forbidden");
    return ctx;
}

/** Only allow same-site relative redirects (prevents open redirects). */
export function safeNext(next: string | null | undefined, fallback: string): string {
    if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
    return next;
}
