"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup" | "forgot" | "reset" | "admin";

const COPY: Record<Mode, { title: string; subtitle: string; cta: string }> = {
    login: { title: "Sign in", subtitle: "Sign in to complete, save and download your Clear Debt forms.", cta: "Sign in" },
    signup: { title: "Create your account", subtitle: "An account keeps your forms private and lets you download your signed copies.", cta: "Create account" },
    forgot: { title: "Reset your password", subtitle: "Enter your email and we'll send you a link to choose a new password.", cta: "Send reset link" },
    reset: { title: "Choose a new password", subtitle: "Enter a new password for your account.", cta: "Update password" },
    admin: { title: "Admin sign in", subtitle: "Restricted area. Authorised Clear Debt staff only.", cta: "Sign in" },
};

function friendlyError(message: string): string {
    const m = message.toLowerCase();
    if (m.includes("invalid login credentials")) return "Incorrect email or password.";
    if (m.includes("email not confirmed")) return "Please confirm your email address first — check your inbox for the confirmation link.";
    if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts. Please wait a few minutes and try again.";
    if (m.includes("password should be")) return "Please choose a stronger password (at least 8 characters).";
    if (m.includes("same password")) return "Your new password must be different from the old one.";
    if (m.includes("fetch")) return "Couldn't reach the server — check your connection and try again.";
    return "Something went wrong. Please try again.";
}

export default function AuthForm({ mode, next, initialError }: { mode: Mode; next: string; initialError?: string }) {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [fullName, setFullName] = useState("");
    const [error, setError] = useState(initialError ?? "");
    const [notice, setNotice] = useState("");
    const [busy, setBusy] = useState(false);

    const copy = COPY[mode];
    const needsPassword = mode !== "forgot";
    const needsEmail = mode !== "reset";
    const choosingPassword = mode === "signup" || mode === "reset";

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setNotice("");

        if (choosingPassword) {
            if (password.length < 8) return setError("Password must be at least 8 characters.");
            if (password !== confirm) return setError("Passwords don't match.");
        }
        if (mode === "signup" && fullName.trim().length < 2) return setError("Please enter your full name.");

        setBusy(true);
        const supabase = createClient();
        try {
            const origin = window.location.origin;

            if (mode === "login" || mode === "admin") {
                const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
                if (err) return setError(friendlyError(err.message));

                if (mode === "admin") {
                    const { data: isAdmin } = await supabase.rpc("is_admin");
                    if (isAdmin !== true) {
                        await supabase.auth.signOut();
                        return setError("This account doesn't have admin access.");
                    }
                }
                router.replace(next);
                router.refresh();
                return;
            }

            if (mode === "signup") {
                const { data, error: err } = await supabase.auth.signUp({
                    email: email.trim(),
                    password,
                    options: {
                        data: { full_name: fullName.trim() },
                        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
                    },
                });
                if (err) return setError(friendlyError(err.message));
                if (data.session) {
                    router.replace(next);
                    router.refresh();
                    return;
                }
                setNotice("Almost done — we've sent a confirmation link to your email. Open it to activate your account, then sign in.");
                return;
            }

            if (mode === "forgot") {
                await supabase.auth.resetPasswordForEmail(email.trim(), {
                    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/forms/reset-password")}`,
                });
                // Same message whether or not the address exists (no account enumeration).
                setNotice("If an account exists for that email, a reset link is on its way.");
                return;
            }

            if (mode === "reset") {
                const { error: err } = await supabase.auth.updateUser({ password });
                if (err) return setError(friendlyError(err.message));
                router.replace("/forms");
                router.refresh();
            }
        } catch (err) {
            setError(friendlyError(err instanceof Error ? err.message : ""));
        } finally {
            setBusy(false);
        }
    }

    const nextQuery = next && next !== "/forms" ? `?next=${encodeURIComponent(next)}` : "";

    return (
        <div className="cd-auth">
            <div className="cd-card">
                <div className="cd-card-header">
                    <div>
                        <h2>{copy.title}</h2>
                        <p>{copy.subtitle}</p>
                    </div>
                </div>
                <form className="cd-card-body" onSubmit={onSubmit} noValidate>
                    {error && (
                        <div className="cd-alert cd-alert-error" role="alert" style={{ marginBottom: 0 }}>
                            {error}
                        </div>
                    )}
                    {notice && (
                        <div className="cd-alert cd-alert-success" role="status" style={{ marginBottom: 0 }}>
                            {notice}
                        </div>
                    )}

                    {mode === "signup" && (
                        <div className="cd-field">
                            <label htmlFor="auth-name">Full name</label>
                            <input id="auth-name" className="cd-input" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                        </div>
                    )}
                    {needsEmail && (
                        <div className="cd-field">
                            <label htmlFor="auth-email">Email</label>
                            <input id="auth-email" className="cd-input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                    )}
                    {needsPassword && (
                        <div className="cd-field">
                            <div className="cd-auth-row">
                                <label htmlFor="auth-password" className="cd-label">
                                    {choosingPassword ? "New password" : "Password"}
                                </label>
                                {mode === "login" && <Link href="/forms/forgot-password">Forgot password?</Link>}
                            </div>
                            <input
                                id="auth-password"
                                className="cd-input"
                                type="password"
                                autoComplete={choosingPassword ? "new-password" : "current-password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    )}
                    {choosingPassword && (
                        <div className="cd-field">
                            <label htmlFor="auth-confirm">Confirm password</label>
                            <input id="auth-confirm" className="cd-input" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
                        </div>
                    )}

                    <button type="submit" className="cd-btn cd-btn-primary cd-btn-block" disabled={busy}>
                        {busy && <span className="cd-spinner" aria-hidden />}
                        {copy.cta}
                    </button>

                    {mode === "login" && (
                        <p className="cd-auth-foot">
                            New to Clear Debt? <Link href={`/forms/signup${nextQuery}`}>Create an account</Link>
                        </p>
                    )}
                    {mode === "signup" && (
                        <p className="cd-auth-foot">
                            Already have an account? <Link href={`/forms/login${nextQuery}`}>Sign in</Link>
                        </p>
                    )}
                    {mode === "forgot" && (
                        <p className="cd-auth-foot">
                            <Link href="/forms/login">Back to sign in</Link>
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}
