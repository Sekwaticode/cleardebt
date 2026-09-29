"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import logo from "@/assets/images/logo.jpeg";
import SignOutButton from "@/components/portal/SignOutButton";

const NAV = [
    {
        href: "/admin",
        label: "Dashboard",
        exact: true,
        icon: <path d="M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z" />,
    },
    {
        href: "/admin/submissions",
        label: "Submissions",
        icon: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm0 0v6h6M8 13h8M8 17h5" />,
    },
];

export default function AdminSidebar({ email }: { email: string }) {
    const pathname = usePathname();
    return (
        <aside className="cd-sidebar">
            <div className="cd-sidebar-brand">
                <Image src={logo} alt="" width={34} height={34} />
                <div>
                    <strong>Clear Debt</strong>
                    <span>Submissions console</span>
                </div>
            </div>
            <nav className="cd-nav" aria-label="Admin">
                <div className="cd-nav-label">Manage</div>
                {NAV.map((item) => {
                    const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                    return (
                        <Link key={item.href} href={item.href} className={active ? "is-active" : undefined} aria-current={active ? "page" : undefined}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                {item.icon}
                            </svg>
                            {item.label}
                        </Link>
                    );
                })}
                <div className="cd-nav-label">Site</div>
                <Link href="/">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M3 10.5 12 3l9 7.5V21H3V10.5Z" />
                    </svg>
                    Public website
                </Link>
            </nav>
            <div className="cd-sidebar-foot">
                <span className="cd-sidebar-email">{email}</span>
                <SignOutButton redirectTo="/admin/login" />
            </div>
        </aside>
    );
}
