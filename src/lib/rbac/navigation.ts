import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { navItems } from "@/db/schema";
import type { AuthenticatedUser } from "@/lib/auth/session";

export interface PortalNavItem {
  key: string;
  label: string;
  href: string;
  icon: string;
  group: string;
}

export interface PortalNavGroup {
  group: string;
  items: PortalNavItem[];
}

/**
 * Builds the Staff Portal navigation from the database and filters it against
 * the caller's effective permissions. Links the user cannot use are never
 * rendered — but the pages behind them are independently guarded server-side.
 */
export async function getNavigationForUser(user: AuthenticatedUser): Promise<PortalNavGroup[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(navItems)
    .where(eq(navItems.isActive, true))
    .orderBy(asc(navItems.sortOrder));

  const granted = new Set(user.permissions);
  const visible = rows.filter((row) => {
    if (row.hideIfPermissionKey && granted.has(row.hideIfPermissionKey)) return false;
    if (!row.permissionKey) return true;
    return granted.has(row.permissionKey);
  });

  const groups: PortalNavGroup[] = [];
  for (const row of visible) {
    let group = groups.find((entry) => entry.group === row.group);
    if (!group) {
      group = { group: row.group, items: [] };
      groups.push(group);
    }
    group.items.push({
      key: row.key,
      label: row.label,
      href: row.href,
      icon: row.icon,
      group: row.group,
    });
  }

  return groups;
}
