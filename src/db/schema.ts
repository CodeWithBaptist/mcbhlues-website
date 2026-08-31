import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/* -------------------------------------------------------------------------- */
/*  RBAC CORE                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Permissions are the atomic unit of authorisation.
 * Nothing in the application is allowed to hardcode a role name where a
 * permission key can be used instead.
 */
export const permissions = pgTable(
  "permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: text("key").notNull(), // e.g. "property:create"
    resource: text("resource").notNull(), // e.g. "property"
    action: text("action").notNull(), // e.g. "create"
    module: text("module").notNull(), // grouping for the permission matrix UI
    description: text("description").notNull().default(""),
    isSystem: boolean("is_system").notNull().default(false), // cannot be deleted
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("permissions_key_unique").on(table.key)]
);

/**
 * Roles are pure data: they can be created, renamed and re-scoped at runtime.
 * `level` expresses hierarchy (higher = more powerful) so that "an Admin cannot
 * manage a Super Admin" is enforced by data rather than by a hardcoded check.
 */
export const roles = pgTable(
  "roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: text("key").notNull(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    level: integer("level").notNull().default(10),
    isSystem: boolean("is_system").notNull().default(false),
    isAssignable: boolean("is_assignable").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("roles_key_unique").on(table.key)]
);

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.roleId, table.permissionId] })]
);

/* -------------------------------------------------------------------------- */
/*  STAFF ACCOUNTS                                                             */
/* -------------------------------------------------------------------------- */

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull().default(""),
    passwordHash: text("password_hash"), // null until the invite is accepted
    /** active | disabled | invited */
    status: text("status").notNull().default("invited"),
    avatarUrl: text("avatar_url"),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)]
);

/** A staff member may hold one or more roles. */
export const userRoles = pgTable(
  "user_roles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    assignedBy: uuid("assigned_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.roleId] })]
);

/**
 * Optional per-user overrides layered on top of the role permissions.
 * `effect` is "allow" (grant an extra permission) or "deny" (revoke one that
 * the role would otherwise grant). Deny always wins.
 */
export const userPermissions = pgTable(
  "user_permissions",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
    effect: text("effect").notNull().default("allow"),
    grantedBy: uuid("granted_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.permissionId] })]
);

/* -------------------------------------------------------------------------- */
/*  SESSIONS & INVITATIONS                                                     */
/* -------------------------------------------------------------------------- */

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    userAgent: text("user_agent").notNull().default(""),
    ipAddress: text("ip_address").notNull().default(""),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("sessions_token_hash_unique").on(table.tokenHash)]
);

export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    invitedBy: uuid("invited_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("invitations_token_hash_unique").on(table.tokenHash)]
);

/* -------------------------------------------------------------------------- */
/*  NAVIGATION (permission driven, stored in the database)                     */
/* -------------------------------------------------------------------------- */

export const navItems = pgTable(
  "nav_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: text("key").notNull(),
    label: text("label").notNull(),
    href: text("href").notNull(),
    icon: text("icon").notNull().default("Circle"),
    group: text("group").notNull().default("General"),
    /** required permission; null = visible to any authenticated staff member */
    permissionKey: text("permission_key"),
    /** hide this entry when the user holds this permission (role-free tailoring) */
    hideIfPermissionKey: text("hide_if_permission_key"),
    sortOrder: integer("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [uniqueIndex("nav_items_key_unique").on(table.key)]
);

/* -------------------------------------------------------------------------- */
/*  LOGGING                                                                    */
/* -------------------------------------------------------------------------- */

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id"),
    userEmail: text("user_email").notNull().default("system"),
    action: text("action").notNull(), // e.g. "staff.role_changed"
    resource: text("resource").notNull(), // e.g. "user"
    resourceId: text("resource_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    ipAddress: text("ip_address").notNull().default(""),
    userAgent: text("user_agent").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("audit_logs_created_at_idx").on(table.createdAt)]
);

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id"),
    userEmail: text("user_email").notNull().default("system"),
    action: text("action").notNull(),
    description: text("description").notNull().default(""),
    path: text("path").notNull().default(""),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    ipAddress: text("ip_address").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("activity_logs_created_at_idx").on(table.createdAt)]
);

/* -------------------------------------------------------------------------- */
/*  SETTINGS                                                                   */
/* -------------------------------------------------------------------------- */

export const settings = pgTable(
  "settings",
  {
    key: text("key").primaryKey(),
    value: jsonb("value").$type<unknown>(),
    scope: text("scope").notNull().default("company"), // company | system
    updatedBy: uuid("updated_by"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  }
);

export type User = typeof users.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type Permission = typeof permissions.$inferSelect;
export type NavItem = typeof navItems.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
