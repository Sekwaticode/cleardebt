import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
    return updateSession(request);
}

export const config = {
    // Only the portal, admin area, auth callback and API need a session;
    // the public marketing pages are left untouched.
    matcher: ["/forms/:path*", "/admin/:path*", "/api/:path*", "/auth/:path*"],
};
