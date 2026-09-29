import type { Metadata } from "next";
import Link from "next/link";
import "@/styles/portal.css";
import { getSessionContext } from "@/lib/auth";
import { ToastProvider } from "@/components/portal/Toast";
import SignOutButton from "@/components/portal/SignOutButton";

export const metadata: Metadata = {
    title: "Client Forms — Clear Debt",
    robots: { index: false, follow: false },
};

export default async function FormsLayout({ children }: { children: React.ReactNode }) {
    const session = await getSessionContext();
    const name = session?.fullName || session?.user.email || "";
    const initials = name
        .split(/[\s@.]+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join("");

    return (
        <div className="cd-app cd-portal">
            <ToastProvider>
                <div className="cd-band">
                    <div className="cd-container cd-band-row">
                        <span className="cd-eyebrow">Clear Debt · Client Portal</span>
                        {session && (
                            <div className="cd-userchip">
                                <Link href="/forms">My forms</Link>
                                {session.role === "admin" && <Link href="/admin">Admin</Link>}
                                <span className="cd-avatar" aria-hidden>
                                    {initials}
                                </span>
                                <span>{session.user.email}</span>
                                <SignOutButton redirectTo="/forms/login" />
                            </div>
                        )}
                    </div>
                </div>
                <main className="cd-container cd-portal-main">{children}</main>
                <footer className="cd-container cd-portal-footer">
                    © {new Date().getFullYear()} Clear Debt (Pty) Ltd · Your information is processed in line with the Protection of Personal Information Act (POPIA).
                </footer>
            </ToastProvider>
        </div>
    );
}
