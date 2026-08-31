import { NextResponse, type NextRequest } from "next/server";
import { AuthError, requireAuth, requirePermission, type PermissionMode } from "./permissions";
import type { AuthenticatedUser } from "@/lib/auth/session";

export type RouteContext = { params: Promise<Record<string, string>> };

type Handler = (
  request: NextRequest,
  context: RouteContext & { user: AuthenticatedUser }
) => Promise<Response> | Response;

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
      const user = await requireAuth();
      return await handler(request, { ...context, user });
    } catch (error) {
      return errorResponse(error);
    }
  };
}

export { errorResponse };
