import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

const PUBLIC_FORM_PATHS = ["/forms/login", "/forms/signup", "/forms/forgot-password"];

/**
 * Refreshes the Supabase session cookie on every matched request and
 * redirects signed-out visitors away from protected pages. Role checks
 * (admin vs client) happen server-side in layouts and route handlers.
 */
export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({ request });

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return response;

    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                response = NextResponse.next({ request });
                cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
            },
        },
    });

    // getUser() validates the JWT with Supabase; getSession() alone is not trustworthy here.
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { pathname, search } = request.nextUrl;

    const redirectTo = (path: string, withNext: boolean) => {
        const url = request.nextUrl.clone();
        url.pathname = path;
        url.search = "";
        if (withNext) url.searchParams.set("next", pathname + search);
        const res = NextResponse.redirect(url);
        response.cookies.getAll().forEach((c) => res.cookies.set(c));
        return res;
    };

    const isPublicFormPath = PUBLIC_FORM_PATHS.includes(pathname);

    if (pathname.startsWith("/forms")) {
        if (!user && !isPublicFormPath) return redirectTo("/forms/login", true);
        if (user && isPublicFormPath) return redirectTo("/forms", false);
    }

    if (pathname.startsWith("/admin") && pathname !== "/admin/login" && !user) {
        return redirectTo("/admin/login", true);
    }

    return response;
}
