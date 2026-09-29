import type { Metadata } from "next";
import "@/styles/portal.css";
import { ToastProvider } from "@/components/portal/Toast";

export const metadata: Metadata = {
    title: "Admin — Clear Debt",
    robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="cd-app cd-admin-area">
            <ToastProvider>{children}</ToastProvider>
        </div>
    );
}
