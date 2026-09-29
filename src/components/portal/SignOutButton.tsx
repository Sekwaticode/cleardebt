"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton({ redirectTo, className = "cd-btn cd-btn-sm cd-btn-outline" }: { redirectTo: string; className?: string }) {
    const router = useRouter();
    return (
        <button
            type="button"
            className={className}
            onClick={async () => {
                await createClient().auth.signOut();
                router.replace(redirectTo);
                router.refresh();
            }}
        >
            Sign out
        </button>
    );
}
