import { NextResponse, type NextRequest } from "next/server";
import { AuthError, requireAuth, requirePermission, type PermissionMode } from "./permissions";
import type { AuthenticatedUser } from "@/lib/auth/session";

export type RouteContext = { params: Promise<Record<string, string>> };

type Handler = (
  request: NextRequest,
  context: RouteContext & { user: AuthenticatedUser }
) => Promise<Response> | Response;

/** Methods that can mutate state — these are the ones CSRF cares about. */
const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function errorResponse(error: unknown) {
  if (error instanceof AuthError) {
    return NextResponse.json(
      { error: error.message, code: error.code, requiredPermissions: error.required ?? [] },
      { status: error.status }
    );
  }
  console.error("[api]", error);
  const message = error instanceof Error ? error.message : "Unexpected server error.";
  return NextResponse.json({ error: message, code: "SERVER_ERROR" }, { status: 500 });
}

/**
 * Validate the Origin / Referer header on mutating requests to guard against
 * cross-site request forgery.  SameSite=Lax session cookies block most CSRF
 * already in modern browsers, but this provides defence in depth: a forged
 * cross-site POST/PUT/PATCH/DELETE from another origin is rejected even if
 * cookie protections are somehow bypassed.
 *
 * Safe methods (GET/HEAD/OPTIONS) are exempt — they are read-only and the
 * permission/authorisation layer controls what they return.
 */
function assertSameOrigin(request: NextRequest) {
  if (!MUTATING_METHODS.has(request.method.toUpperCase())) return;

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const hostHeader = request.headers.get("host") ?? request.nextUrl.host;
  const host = hostHeader.split(":")[0].toLowerCase();

  // Local development relaxes the check so sandbox previews (random *.e2b.app
  // hosts) continue to work.  In production we strictly enforce it.
  const isLocal =
    host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host.endsWith(".local");

  function matches(source: string | null): boolean {
    if (!source) return false;
    try {
      const url = new URL(source);
      return url.hostname.toLowerCase() === host;
    } catch {
      return false;
    }
  }

  const source = origin || referer;
  if (process.env.NODE_ENV === "production" && !isLocal) {
    if (!matches(source)) {
      throw new AuthError(
        "Cross-origin request rejected.",
        403,
        "FORBIDDEN"
      );
    }
  }
}

/**
 * Wraps an API route handler with a *backend* permission check.
 *
 * Hidden buttons and filtered navigation are never the security boundary:
 * hitting the URL directly still lands here first, so an unauthorised caller
 * receives 401/403 regardless of what the UI showed them.
 */
export function withPermission(
  required: string | readonly string[],
  handler: Handler,
  mode: PermissionMode = "any"
) {
  return async (request: NextRequest, context: RouteContext) => {
    try {
      assertSameOrigin(request);
      const user = await requirePermission(required, mode);
      return await handler(request, { ...context, user });
    } catch (error) {
      return errorResponse(error);
    }
  };
}

/** Authentication only (no specific permission required). */
export function withAuth(handler: Handler) {
  return async (request: NextRequest, context: RouteContext) => {
    try {
      assertSameOrigin(request);
      const user = await requireAuth();
      return await handler(request, { ...context, user });
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export { errorResponse };
