import type { Metadata } from "next";
import { safeNext } from "@/lib/auth";
import AuthForm from "@/components/portal/AuthForm";

export const metadata: Metadata = { title: "Create account — Clear Debt" };

const ERRORS: Record<string, string> = {
    link: "That link is invalid or has expired. Please try again.",
};

export default function Page({ searchParams }: { searchParams: { next?: string; error?: string } }) {
    return (
        <AuthForm
            mode="signup"
            next={safeNext(searchParams.next, "/forms")}
            initialError={searchParams.error ? ERRORS[searchParams.error] : undefined}
        />
    );
}
