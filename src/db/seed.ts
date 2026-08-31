import { eq, inArray } from "drizzle-orm";
import type { Database } from "./index";
import {
  navItems,
  permissions,
  rolePermissions,
  roles,
  userRoles,
  users,
} from "./schema";
import { NAV_SEED, PERMISSION_SEED, ROLE_SEED, USER_SEED } from "./seed-data";
import { generateToken, hashPassword } from "@/lib/auth/password";

/**
 * Demo staff (one account per role) are only created outside production, or
 * when SEED_DEMO_STAFF=true is set explicitly. A deployed environment gets a
 * single Super Admin instead.
 */
function shouldSeedDemoStaff() {
  if (process.env.SEED_DEMO_STAFF === "true") return true;
  if (process.env.SEED_DEMO_STAFF === "false") return false;
  return process.env.NODE_ENV !== "production";
}

/**
 * Seeds the RBAC catalogue. Everything is upserted by natural key so an
 * existing database keeps its runtime customisations (extra roles, edited
 * role/permission mappings, new staff) while newly shipped permissions and
 * navigation entries are still added.
 */
export async function seedDatabase(db: Database) {
  /* ---- permissions ------------------------------------------------------ */
  const existingPermissions = await db.select().from(permissions);
  const existingPermissionKeys = new Set(existingPermissions.map((row) => row.key));

  const missingPermissions = PERMISSION_SEED.filter((row) => !existingPermissionKeys.has(row.key));
  if (missingPermissions.length > 0) {
    await db.insert(permissions).values(
      missingPermissions.map((row) => {
        const [resource, action] = row.key.split(":");
        return {
          key: row.key,
          resource,
          action,
          module: row.module,
          description: row.description,
          isSystem: true,
        };
      })
    ).onConflictDoNothing();
  }

  const allPermissions = await db.select().from(permissions);
  const permissionIdByKey = new Map(allPermissions.map((row) => [row.key, row.id]));

  /* ---- roles ------------------------------------------------------------ */
  const existingRoles = await db.select().from(roles);
  const existingRoleKeys = new Set(existingRoles.map((row) => row.key));

  const freshRoleKeys: string[] = [];
  for (const role of ROLE_SEED) {
    if (existingRoleKeys.has(role.key)) continue;
    await db
      .insert(roles)
      .values({
        key: role.key,
        name: role.name,
        description: role.description,
        level: role.level,
        isSystem: true,
      })
      .onConflictDoNothing();
    freshRoleKeys.push(role.key);
  }

  const allRoles = await db.select().from(roles);
  const roleByKey = new Map(allRoles.map((row) => [row.key, row]));

  // Only wire default permissions for roles created by this seed run, so that
  // administrators can freely re-scope a role afterwards without it being
  // reset on the next boot.
  for (const roleKey of freshRoleKeys) {
    const seed = ROLE_SEED.find((row) => row.key === roleKey);
    const role = roleByKey.get(roleKey);
    if (!seed || !role) continue;

    const keys = seed.permissions === "*" ? allPermissions.map((row) => row.key) : seed.permissions;
    const values = keys
      .map((key) => permissionIdByKey.get(key))
      .filter((id): id is string => Boolean(id))
      .map((permissionId) => ({ roleId: role.id, permissionId }));

    if (values.length > 0) await db.insert(rolePermissions).values(values).onConflictDoNothing();
  }

  // The Super Admin must always hold every permission in the catalogue,
  // including permissions added by future releases.
  const superAdmin = roleByKey.get("super_admin");
  if (superAdmin) {
    const held = await db
      .select({ permissionId: rolePermissions.permissionId })
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, superAdmin.id));
    const heldIds = new Set(held.map((row) => row.permissionId));
    const missing = allPermissions
      .filter((row) => !heldIds.has(row.id))
      .map((row) => ({ roleId: superAdmin.id, permissionId: row.id }));
    if (missing.length > 0) await db.insert(rolePermissions).values(missing).onConflictDoNothing();
  }

  /* ---- navigation ------------------------------------------------------- */
  const existingNav = await db.select().from(navItems);
  const existingNavKeys = new Set(existingNav.map((row) => row.key));
  const missingNav = NAV_SEED.filter((row) => !existingNavKeys.has(row.key));
  if (missingNav.length > 0) {
    await db.insert(navItems).values(
      missingNav.map((row) => ({
        key: row.key,
        label: row.label,
        href: row.href,
        icon: row.icon,
        group: row.group,
        permissionKey: row.permissionKey,
        hideIfPermissionKey: row.hideIfPermissionKey ?? null,
        sortOrder: row.sortOrder,
      }))
    ).onConflictDoNothing();
  }

  /* ---- staff accounts --------------------------------------------------- */
  const demo = shouldSeedDemoStaff();
  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL ?? "superadmin@mcbhlues.com")
    .trim()
    .toLowerCase();

  // Outside development only the Super Admin is provisioned.
  const wanted = demo
    ? USER_SEED.map((row) =>
        row.role === "super_admin" ? { ...row, email: superAdminEmail } : row
      )
    : [
        {
          firstName: process.env.SUPER_ADMIN_FIRST_NAME ?? "System",
          lastName: process.env.SUPER_ADMIN_LAST_NAME ?? "Owner",
          email: superAdminEmail,
          phone: "",
          role: "super_admin",
          password: process.env.SUPER_ADMIN_PASSWORD ?? "",
        },
      ];

  const existingUsers = await db
    .select({ email: users.email })
    .from(users)
    .where(
      inArray(
        users.email,
        wanted.map((row) => row.email)
      )
    );
  const existingEmails = new Set(existingUsers.map((row) => row.email));

  for (const seed of wanted) {
    if (existingEmails.has(seed.email)) continue;
    const role = roleByKey.get(seed.role);
    if (!role) continue;

    // If no password was supplied for a deployed environment, generate a strong
    // one and print it once so the owner can sign in and change it.
    let password = seed.password;
    if (!password) {
      password = `${generateToken(12)}Aa1!`;
      console.warn(
        `[seed] Created Super Admin ${seed.email} with generated password: ${password}\n` +
          "[seed] Sign in and change it immediately, or set SUPER_ADMIN_PASSWORD."
      );
    }

    const [created] = await db
      .insert(users)
      .values({
        firstName: seed.firstName,
        lastName: seed.lastName,
        email: seed.email,
        phone: seed.phone,
        passwordHash: await hashPassword(password),
        status: "active",
      })
      .onConflictDoNothing()
      .returning({ id: users.id });

    if (!created) continue; // another instance won the race
    await db.insert(userRoles).values({ userId: created.id, roleId: role.id }).onConflictDoNothing();
  }
}
