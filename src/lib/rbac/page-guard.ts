import { redirect } from "next/navigation";
import { getCurrentUser, type AuthenticatedUser } from "@/lib/auth/session";
import { hasPermission, type PermissionMode } from "./can";

export type PageAccess =
  | { allowed: true; user: AuthenticatedUser }
  | { allowed: false; user: AuthenticatedUser; required: string[] };

/**
 * Server-side page guard. Anonymous visitors are redirected to the login
 * screen; authenticated staff without the permission get an explicit
 * "access denied" screen instead of a silent blank page.
 */
export async function pageAccess(
  required: string | readonly string[],
  mode: PermissionMode = "any"
): Promise<PageAccess> {
  const user = await getCurrentUser();
  if (!user) redirect("/portal/login");

  const list = typeof required === "string" ? [required] : [...required];
  if (!hasPermission(user.permissions, list, mode)) {
    return { allowed: false, user, required: list };
  }
  return { allowed: true, user };
}
