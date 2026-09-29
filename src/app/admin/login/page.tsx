import type { Metadata } from "next";
import Image from "next/image";
import { safeNext } from "@/lib/auth";
import AuthForm from "@/components/portal/AuthForm";
import logo from "@/assets/images/logo.jpeg";

export const metadata: Metadata = { title: "Admin sign in — Clear Debt" };

export default function AdminLoginPage({ searchParams }: { searchParams: { next?: string; error?: string } }) {
    const next = safeNext(searchParams.next, "/admin");
    return (
        <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "32px 16px", background: "var(--cd-band)" }}>
            <div style={{ width: "100%", maxWidth: 440 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, justifyContent: "center", marginBottom: 20, color: "#fff" }}>
                    <Image src={logo} alt="" width={44} height={44} style={{ borderRadius: "50%" }} />
                    <div>
                        <strong style={{ display: "block", fontSize: 16 }}>Clear Debt</strong>
                        <span style={{ fontSize: 12, opacity: 0.7 }}>Submissions console</span>
                    </div>
                </div>
                <AuthForm
                    mode="admin"
                    next={next.startsWith("/admin") ? next : "/admin"}
                    initialError={searchParams.error === "forbidden" ? "This account doesn't have admin access." : undefined}
                />
            </div>
        </div>
    );
}
