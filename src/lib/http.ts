import "server-only";
import { NextResponse } from "next/server";
import { getSessionContext, type SessionContext } from "./auth";

/** Error whose message is safe to show to the end user. */
export class HttpError extends Error {
    constructor(
        public status: number,
        message: string,
        public extra?: Record<string, unknown>,
    ) {
        super(message);
    }
}

export function jsonError(status: number, message: string, extra?: Record<string, unknown>) {
    return NextResponse.json({ error: message, ...extra }, { status, headers: { "Cache-Control": "no-store" } });
}

/**
 * Wraps a route handler: resolves the session, enforces the required
 * role, and turns thrown errors into safe JSON responses. Unexpected
 * errors are logged server-side and never leaked to the browser.
 */
export function withAuth<P>(
    role: "user" | "admin",
    handler: (req: Request, ctx: SessionContext, params: P) => Promise<Response>,
) {
    return async (req: Request, { params }: { params: P }) => {
        try {
            const session = await getSessionContext();
            if (!session) return jsonError(401, "Your session has expired. Please sign in again.");
            if (role === "admin" && session.role !== "admin") {
                return jsonError(403, "You don't have permission to do that.");
            }
            return await handler(req, session, params);
        } catch (err) {
            if (err instanceof HttpError) return jsonError(err.status, err.message, err.extra);
            console.error(`[api] ${req.method} ${new URL(req.url).pathname} failed:`, err);
            return jsonError(500, "Something went wrong on our side. Please try again.");
        }
    };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(value: unknown): value is string {
    return typeof value === "string" && UUID_RE.test(value);
}
