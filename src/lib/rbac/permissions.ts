import { getCurrentUser, type AuthenticatedUser } from "@/lib/auth/session";
import { canManageLevel, hasPermission, type PermissionMode } from "./can";

export { canManageLevel, hasPermission, SUPER_ADMIN_LEVEL } from "./can";
export type { PermissionMode } from "./can";

export function userCan(
  user: Pick<AuthenticatedUser, "permissions"> | null,
  required: string | readonly string[],
  mode: PermissionMode = "any"
): boolean {
  if (!user) return false;
  return hasPermission(user.permissions, required, mode);
}

export class AuthError extends Error {
  constructor(
    message: string,
    readonly status: 401 | 403,
    readonly code: "UNAUTHENTICATED" | "FORBIDDEN",
    readonly required?: readonly string[]
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/** Throws unless a valid session exists. */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("Authentication required.", 401, "UNAUTHENTICATED");
  }
  return user;
}

/**
 * Throws unless the caller is authenticated AND holds the permission(s).
 * Every protected server action, route handler and page must call this — the
 * frontend checks exist purely for user experience.
 */
export async function requirePermission(
  required: string | readonly string[],
  mode: PermissionMode = "any"
): Promise<AuthenticatedUser> {
  const user = await requireAuth();
  if (!hasPermission(user.permissions, required, mode)) {
    throw new AuthError(
      "You do not have permission to perform this action.",
      403,
      "FORBIDDEN",
      typeof required === "string" ? [required] : required
    );
  }
  return user;
}

/** Hierarchy assertion for administering another account. */
export function assertLevel(actor: AuthenticatedUser, targetLevel: number) {
  if (!canManageLevel(actor, targetLevel)) {
    throw new AuthError(
      "You cannot manage an account or role at or above your own level.",
      403,
      "FORBIDDEN"
    );
  }
}
