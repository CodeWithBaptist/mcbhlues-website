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
/*  PROPERTIES                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * A property listing. `type` is "sale" | "rent"; `status` is
 * available | sold | pending | rented. `isPublished` controls whether it
 * appears on the public website; a Sales Agent with `property:read_available`
 * additionally only sees published/available rows.
 */
export const properties = pgTable(
  "properties",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull().default(""),
    /** sale | rent */
    type: text("type").notNull().default("sale"),
    /** available | sold | pending | rented */
    status: text("status").notNull().default("available"),
    price: integer("price").notNull().default(0),
    currency: text("currency").notNull().default("NGN"),
    beds: integer("beds").notNull().default(0),
    baths: integer("baths").notNull().default(0),
    sqft: integer("sqft").notNull().default(0),
    yearBuilt: integer("year_built"),
    address: text("address").notNull().default(""),
    city: text("city").notNull().default(""),
    state: text("state").notNull().default(""),
    postalCode: text("postal_code").notNull().default(""),
    country: text("country").notNull().default(""),
    latitude: text("latitude").notNull().default(""),
    longitude: text("longitude").notNull().default(""),
    googleMapsUrl: text("google_maps_url").notNull().default(""),
    isFeatured: boolean("is_featured").notNull().default(false),
    isPublished: boolean("is_published").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("properties_slug_unique").on(table.slug)]
);

export const propertyImages = pgTable(
  "property_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    alt: text("alt").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    isPrimary: boolean("is_primary").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("property_images_property_id_idx").on(table.propertyId)]
);

export const propertyAmenities = pgTable(
  "property_amenities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    icon: text("icon").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("property_amenities_property_id_idx").on(table.propertyId)]
);

export const propertyFeatures = pgTable(
  "property_features",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("property_features_property_id_idx").on(table.propertyId)]
);

/** Which staff members a property is assigned to (drives `property:assigned_read`). */
export const propertyAssignments = pgTable(
  "property_assignments",
  {
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assignedBy: uuid("assigned_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.propertyId, table.userId] })]
);

/* -------------------------------------------------------------------------- */
/*  CUSTOMERS                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * A customer (buyer / renter / investor / seller). `assignedTo` drives the
 * scoped `customer:assigned_read` permission — agents without customer:read
 * only see the customers assigned to them.
 */
export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull().default(""),
    phone: text("phone").notNull().default(""),
    /** buyer | renter | investor | seller */
    type: text("type").notNull().default("buyer"),
    /** active | lead | inactive */
    status: text("status").notNull().default("active"),
    source: text("source").notNull().default(""),
    budgetMin: integer("budget_min").notNull().default(0),
    budgetMax: integer("budget_max").notNull().default(0),
    preferredLocation: text("preferred_location").notNull().default(""),
    notes: text("notes").notNull().default(""),
    assignedTo: uuid("assigned_to").references(() => users.id, { onDelete: "set null" }),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("customers_assigned_to_idx").on(table.assignedTo)]
);

/** Internal staff notes attached to a customer record (customer:notes). */
export const customerNotes = pgTable(
  "customer_notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    userId: uuid("user_id"),
    userEmail: text("user_email").notNull().default("system"),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("customer_notes_customer_id_idx").on(table.customerId)]
);

/** Properties a customer has saved / shortlisted. */
export const customerSavedProperties = pgTable(
  "customer_saved_properties",
  {
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.customerId, table.propertyId] })]
);

/* -------------------------------------------------------------------------- */
/*  ENQUIRIES                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * An enquiry — from the public website (contact form, property inquiry) or
 * logged manually by staff. `assignedTo`/`propertyId` drive the scoped read
 * permissions enquiry:assigned_read and enquiry:property_read.
 */
export const enquiries = pgTable(
  "enquiries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** human-friendly reference, e.g. ENQ-0001 */
    reference: text("reference").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull().default(""),
    phone: text("phone").notNull().default(""),
    subject: text("subject").notNull().default(""),
    message: text("message").notNull().default(""),
    /** general | property | viewing */
    type: text("type").notNull().default("general"),
    /** website | portal | phone | walk-in */
    source: text("source").notNull().default("website"),
    /** new | in_progress | responded | closed */
    status: text("status").notNull().default("new"),
    /** low | normal | high */
    priority: text("priority").notNull().default("normal"),
    propertyId: uuid("property_id").references(() => properties.id, { onDelete: "set null" }),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    assignedTo: uuid("assigned_to").references(() => users.id, { onDelete: "set null" }),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("enquiries_reference_unique").on(table.reference),
    index("enquiries_status_idx").on(table.status),
    index("enquiries_assigned_to_idx").on(table.assignedTo),
    index("enquiries_property_id_idx").on(table.propertyId),
  ]
);

/** Internal notes and outward responses on an enquiry, kept as one thread. */
export const enquiryNotes = pgTable(
  "enquiry_notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    enquiryId: uuid("enquiry_id")
      .notNull()
      .references(() => enquiries.id, { onDelete: "cascade" }),
    userId: uuid("user_id"),
    userEmail: text("user_email").notNull().default("system"),
    /** note | response */
    kind: text("kind").notNull().default("note"),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("enquiry_notes_enquiry_id_idx").on(table.enquiryId)]
);

/* -------------------------------------------------------------------------- */
/*  BOOKINGS                                                                   */
/* -------------------------------------------------------------------------- */

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** human-friendly reference, e.g. BKG-0001 */
    reference: text("reference").notNull(),
    /** viewing | consultation | inspection */
    type: text("type").notNull().default("viewing"),
    /** pending | confirmed | completed | cancelled | rejected */
    status: text("status").notNull().default("pending"),
    name: text("name").notNull(),
    email: text("email").notNull().default(""),
    phone: text("phone").notNull().default(""),
    propertyId: uuid("property_id").references(() => properties.id, { onDelete: "set null" }),
    customerId: uuid("customer_id").references(() => customers.id, { onDelete: "set null" }),
    assignedTo: uuid("assigned_to").references(() => users.id, { onDelete: "set null" }),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    durationMinutes: integer("duration_minutes").notNull().default(60),
    location: text("location").notNull().default(""),
    notes: text("notes").notNull().default(""),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("bookings_reference_unique").on(table.reference),
    index("bookings_scheduled_at_idx").on(table.scheduledAt),
    index("bookings_assigned_to_idx").on(table.assignedTo),
    index("bookings_property_id_idx").on(table.propertyId),
  ]
);

/* -------------------------------------------------------------------------- */
/*  CMS: TESTIMONIALS / FAQS / ANNOUNCEMENTS / CONTENT BLOCKS                  */
/* -------------------------------------------------------------------------- */

export const testimonials = pgTable("testimonials", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull().default(""),
  quote: text("quote").notNull(),
  avatarUrl: text("avatar_url").notNull().default(""),
  rating: integer("rating").notNull().default(5),
  isPublished: boolean("is_published").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const faqs = pgTable("faqs", {
  id: uuid("id").defaultRandom().primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  category: text("category").notNull().default("general"),
  isPublished: boolean("is_published").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const announcements = pgTable("announcements", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull().default(""),
  /** info | success | warning */
  tone: text("tone").notNull().default("info"),
  isActive: boolean("is_active").notNull().default(true),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  createdBy: uuid("created_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Editable copy blocks for the public website (hero text, About page, contact
 * blurbs, …). Keyed by a stable string; public pages fall back to hardcoded
 * defaults when a block has never been saved.
 */
export const cmsContent = pgTable("cms_content", {
  key: text("key").primaryKey(),
  label: text("label").notNull().default(""),
  section: text("section").notNull().default("general"),
  value: text("value").notNull().default(""),
  updatedBy: uuid("updated_by"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/* -------------------------------------------------------------------------- */
/*  MEDIA LIBRARY                                                              */
/* -------------------------------------------------------------------------- */

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    url: text("url").notNull(),
    /** image | document | logo */
    kind: text("kind").notNull().default("image"),
    folder: text("folder").notNull().default("general"),
    alt: text("alt").notNull().default(""),
    uploadedBy: uuid("uploaded_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("media_assets_kind_idx").on(table.kind)]
);

/* -------------------------------------------------------------------------- */
/*  NOTIFICATIONS                                                              */
/* -------------------------------------------------------------------------- */

/**
 * In-app notifications. `userId` null = broadcast to every staff member;
 * `readBy` is a jsonb array of user ids who have dismissed it.
 */
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    /** info | enquiry | booking | customer | property | system */
    kind: text("kind").notNull().default("info"),
    link: text("link").notNull().default(""),
    readBy: jsonb("read_by").$type<string[]>().notNull().default([]),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("notifications_user_id_idx").on(table.userId),
    index("notifications_created_at_idx").on(table.createdAt),
  ]
);

/* -------------------------------------------------------------------------- */
/*  EMAIL TEMPLATES (system settings)                                          */
/* -------------------------------------------------------------------------- */

export const emailTemplates = pgTable("email_templates", {
  key: text("key").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull().default(""),
  body: text("body").notNull().default(""),
  updatedBy: uuid("updated_by"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

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

/* -------------------------------------------------------------------------- */
/*  UPLOADS (files stored in the database so they survive read-only hosts)     */
/* -------------------------------------------------------------------------- */

export const uploads = pgTable(
  "uploads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fileName: text("file_name").notNull(),
    contentType: text("content_type").notNull().default("application/octet-stream"),
    byteSize: integer("byte_size").notNull().default(0),
    /** base64-encoded file contents */
    data: text("data").notNull(),
    uploadedBy: uuid("uploaded_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("uploads_created_at_idx").on(table.createdAt)]
);

export type User = typeof users.$inferSelect;
export type Role = typeof roles.$inferSelect;
export type Permission = typeof permissions.$inferSelect;
export type NavItem = typeof navItems.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type PropertyImage = typeof propertyImages.$inferSelect;
export type PropertyAmenity = typeof propertyAmenities.$inferSelect;
export type PropertyFeature = typeof propertyFeatures.$inferSelect;
export type PropertyAssignment = typeof propertyAssignments.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type CustomerNote = typeof customerNotes.$inferSelect;
export type CustomerSavedProperty = typeof customerSavedProperties.$inferSelect;
export type Enquiry = typeof enquiries.$inferSelect;
export type EnquiryNote = typeof enquiryNotes.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Testimonial = typeof testimonials.$inferSelect;
export type Faq = typeof faqs.$inferSelect;
export type Announcement = typeof announcements.$inferSelect;
export type CmsContent = typeof cmsContent.$inferSelect;
export type MediaAsset = typeof mediaAssets.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type Upload = typeof uploads.$inferSelect;
