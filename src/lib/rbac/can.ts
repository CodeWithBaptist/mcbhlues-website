/**
 * Pure, dependency-free permission predicates.
 *
 * This module is safe to import from client components — it never touches the
 * database, cookies or `next/headers`. The server-side guards live in
 * `@/lib/rbac/permissions`.
 */

export type PermissionMode = "all" | "any";

/** Level at and above which an actor may manage their peers. */
export const SUPER_ADMIN_LEVEL = 100;

export function hasPermission(
  granted: readonly string[],
  required: string | readonly string[],
  mode: PermissionMode = "any"
): boolean {
  const list = typeof required === "string" ? [required] : required;
  if (list.length === 0) return true;
  return mode === "all"
    ? list.every((key) => granted.includes(key))
    : list.some((key) => granted.includes(key));
}

/**
 * Hierarchy guard. An actor may only administer accounts and roles that sit
 * strictly below their own highest role level (a Super Admin may also manage
 * their peers). Levels come from the `roles` table, so the hierarchy stays
 * editable instead of being a hardcoded role check.
 */
export function canManageLevel(actor: { level: number }, targetLevel: number): boolean {
  if (actor.level >= SUPER_ADMIN_LEVEL) return true;
  return actor.level > targetLevel;
}
