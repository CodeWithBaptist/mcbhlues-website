/**
 * Seed catalogue for the RBAC system.
 *
 * This file is the *initial* content of the database only. Once seeded, roles,
 * permissions, role/permission mappings and navigation can all be edited from
 * the Staff Portal — nothing in the application reads these constants at
 * runtime to make an authorisation decision.
 */

export interface PermissionSeed {
  key: string;
  module: string;
  description: string;
}

const p = (key: string, module: string, description: string): PermissionSeed => ({
  key,
  module,
  description,
});

export const PERMISSION_SEED: PermissionSeed[] = [
  // ---- Staff management ---------------------------------------------------
  p("staff:read", "Staff Management", "View all staff accounts"),
  p("staff:create", "Staff Management", "Add new staff accounts"),
  p("staff:invite", "Staff Management", "Send secure staff invitations"),
  p("staff:update", "Staff Management", "Edit staff accounts"),
  p("staff:disable", "Staff Management", "Enable or disable staff accounts"),
  p("staff:delete", "Staff Management", "Remove staff accounts"),
  p("staff:reset_password", "Staff Management", "Reset staff passwords"),
  p("staff:assign_role", "Staff Management", "Assign roles to staff"),
  p("staff:remove_role", "Staff Management", "Remove roles from staff"),
  p("staff:manage_permissions", "Staff Management", "Grant or deny individual permissions"),

  // ---- Property management ------------------------------------------------
  p("property:read", "Property Management", "View properties"),
  p("property:read_available", "Property Management", "View available (published) properties"),
  p("property:assigned_read", "Property Management", "View only assigned properties"),
  p("property:create", "Property Management", "Create properties"),
  p("property:update", "Property Management", "Edit properties"),
  p("property:delete", "Property Management", "Delete properties"),
  p("property:publish", "Property Management", "Publish properties"),
  p("property:unpublish", "Property Management", "Unpublish properties"),
  p("property:status_update", "Property Management", "Update property status"),
  p("property:price_update", "Property Management", "Set property prices"),
  p("property:availability_update", "Property Management", "Set property availability"),
  p("property:mark_sold", "Property Management", "Mark properties as sold"),
  p("property:mark_rented", "Property Management", "Mark properties as rented"),
  p("property:image_manage", "Property Management", "Manage property images"),
  p("property:amenity_manage", "Property Management", "Manage property amenities"),
  p("property:feature_manage", "Property Management", "Manage property features"),
  p("property:location_manage", "Property Management", "Set property locations (Google Maps)"),

  // ---- Customer management ------------------------------------------------
  p("customer:read", "Customer Management", "View customers"),
  p("customer:assigned_read", "Customer Management", "View only assigned customers"),
  p("customer:create", "Customer Management", "Add customer information"),
  p("customer:update", "Customer Management", "Edit customer information"),
  p("customer:delete", "Customer Management", "Delete customers"),
  p("customer:notes", "Customer Management", "Add internal customer notes"),
  p("customer:enquiries_read", "Customer Management", "View customer enquiries"),
  p("customer:bookings_read", "Customer Management", "View customer bookings"),
  p("customer:saved_read", "Customer Management", "View customer saved properties"),

  // ---- Enquiry management -------------------------------------------------
  p("enquiry:read", "Enquiry Management", "View all enquiries"),
  p("enquiry:property_read", "Enquiry Management", "View property related enquiries"),
  p("enquiry:assigned_read", "Enquiry Management", "View only assigned enquiries"),
  p("enquiry:create", "Enquiry Management", "Create enquiries"),
  p("enquiry:update", "Enquiry Management", "Update enquiry information"),
  p("enquiry:delete", "Enquiry Management", "Delete enquiry records"),
  p("enquiry:assign", "Enquiry Management", "Assign or forward enquiries to staff"),
  p("enquiry:respond", "Enquiry Management", "Respond to enquiries"),
  p("enquiry:status_update", "Enquiry Management", "Update enquiry status"),
  p("enquiry:notes", "Enquiry Management", "Add internal enquiry notes"),

  // ---- Booking management -------------------------------------------------
  p("booking:read", "Booking Management", "View all bookings"),
  p("booking:property_read", "Booking Management", "View property related bookings"),
  p("booking:assigned_read", "Booking Management", "View only assigned bookings"),
  p("booking:create", "Booking Management", "Create bookings"),
  p("booking:update", "Booking Management", "Update bookings"),
  p("booking:delete", "Booking Management", "Delete bookings"),
  p("booking:approve", "Booking Management", "Confirm bookings"),
  p("booking:reject", "Booking Management", "Reject bookings"),
  p("booking:reschedule", "Booking Management", "Reschedule bookings"),
  p("booking:assign", "Booking Management", "Assign bookings to staff"),
  p("booking:status_update", "Booking Management", "Update booking status"),

  // ---- CMS ----------------------------------------------------------------
  p("cms:read", "Website CMS", "View website content"),
  p("cms:update", "Website CMS", "Edit website content"),
  p("cms:homepage", "Website CMS", "Edit homepage content"),
  p("cms:about", "Website CMS", "Edit the About page"),
  p("cms:services", "Website CMS", "Edit Services"),
  p("cms:testimonials", "Website CMS", "Manage testimonials"),
  p("cms:faqs", "Website CMS", "Manage FAQs"),
  p("cms:contact", "Website CMS", "Manage contact information"),
  p("cms:announcements", "Website CMS", "Manage announcements"),
  p("cms:featured_properties", "Website CMS", "Manage featured properties"),
  p("cms:hero", "Website CMS", "Manage hero sections and banners"),

  // ---- Media --------------------------------------------------------------
  p("media:read", "Media Library", "View media library"),
  p("media:upload", "Media Library", "Upload media"),
  p("media:delete", "Media Library", "Delete media"),
  p("media:documents", "Media Library", "Manage documents"),
  p("media:logo", "Media Library", "Manage the company logo"),

  // ---- Roles & permissions ------------------------------------------------
  p("role:read", "Roles & Permissions", "View roles"),
  p("role:create", "Roles & Permissions", "Create roles"),
  p("role:update", "Roles & Permissions", "Update roles and their permissions"),
  p("role:delete", "Roles & Permissions", "Delete roles"),
  p("permission:read", "Roles & Permissions", "View permissions"),
  p("permission:update", "Roles & Permissions", "Create or update permissions"),

  // ---- Settings -----------------------------------------------------------
  p("settings:read", "System", "View settings"),
  p("settings:update", "System", "Update settings"),
  p("settings:company", "System", "Manage company settings"),
  p("settings:system", "System", "Manage system settings"),
  p("settings:email_templates", "System", "Manage email templates"),
  p("settings:security", "System", "Manage authentication and security configuration"),
  p("notification:read", "System", "View notifications"),
  p("notification:manage", "System", "Manage notifications"),

  // ---- Reports & logs -----------------------------------------------------
  p("report:read", "Reports & Logs", "View reports"),
  p("activity:read", "Reports & Logs", "View staff activity logs"),
  p("audit:read", "Reports & Logs", "View audit logs"),
  p("log:read", "Reports & Logs", "View system logs"),
];

export interface RoleSeed {
  key: string;
  name: string;
  description: string;
  level: number;
  /** "*" grants every permission in the catalogue. */
  permissions: string[] | "*";
}

export const ROLE_SEED: RoleSeed[] = [
  {
    key: "super_admin",
    name: "Super Admin",
    description: "IT Administrator / System Owner. Full access to the entire system.",
    level: 100,
    permissions: "*",
  },
  {
    key: "admin",
    name: "Admin",
    description: "Manages general company operations.",
    level: 80,
    permissions: [
      "property:read",
      "property:create",
      "property:update",
      "property:delete",
      "property:publish",
      "property:unpublish",
      "property:status_update",
      "property:price_update",
      "property:availability_update",
      "property:mark_sold",
      "property:mark_rented",
      "property:image_manage",
      "property:amenity_manage",
      "property:feature_manage",
      "property:location_manage",
      "customer:read",
      "customer:create",
      "customer:update",
      "customer:notes",
      "customer:enquiries_read",
      "customer:bookings_read",
      "customer:saved_read",
      "enquiry:read",
      "enquiry:create",
      "enquiry:update",
      "enquiry:delete",
      "enquiry:assign",
      "enquiry:respond",
      "enquiry:status_update",
      "enquiry:notes",
      "booking:read",
      "booking:create",
      "booking:update",
      "booking:delete",
      "booking:approve",
      "booking:reject",
      "booking:reschedule",
      "booking:assign",
      "booking:status_update",
      "cms:read",
      "cms:update",
      "cms:homepage",
      "cms:about",
      "cms:services",
      "cms:contact",
      "cms:featured_properties",
      "cms:hero",
      "media:read",
      "media:upload",
      "media:delete",
      "media:documents",
      "report:read",
      "activity:read",
      "notification:read",
      "notification:manage",
    ],
  },
  {
    key: "property_manager",
    name: "Property Manager",
    description: "Focuses on property operations.",
    level: 50,
    permissions: [
      "property:read",
      "property:create",
      "property:update",
      "property:publish",
      "property:unpublish",
      "property:status_update",
      "property:price_update",
      "property:availability_update",
      "property:mark_sold",
      "property:mark_rented",
      "property:image_manage",
      "property:amenity_manage",
      "property:feature_manage",
      "property:location_manage",
      "enquiry:property_read",
      "booking:property_read",
      "media:upload",
      "notification:read",
    ],
  },
  {
    key: "sales_agent",
    name: "Sales Agent",
    description: "Focuses on customers, property sales and rentals.",
    level: 40,
    permissions: [
      "property:read_available",
      "property:assigned_read",
      "customer:read",
      "customer:assigned_read",
      "customer:notes",
      "enquiry:assigned_read",
      "enquiry:respond",
      "enquiry:status_update",
      "enquiry:notes",
      "booking:assigned_read",
      "booking:update",
      "booking:reschedule",
      "notification:read",
    ],
  },
  {
    key: "reception",
    name: "Reception",
    description: "Customer support and incoming requests.",
    level: 30,
    permissions: [
      "customer:read",
      "customer:create",
      "customer:notes",
      "enquiry:read",
      "enquiry:create",
      "enquiry:update",
      "enquiry:assign",
      "enquiry:notes",
      "booking:read",
      "booking:create",
      "booking:update",
      "notification:read",
    ],
  },
  {
    key: "content_manager",
    name: "Content Manager",
    description: "Manages the public website content.",
    level: 30,
    permissions: [
      "cms:read",
      "cms:update",
      "cms:homepage",
      "cms:about",
      "cms:services",
      "cms:testimonials",
      "cms:faqs",
      "cms:contact",
      "cms:announcements",
      "cms:featured_properties",
      "cms:hero",
      "media:read",
      "media:upload",
    ],
  },
];

export interface NavSeed {
  key: string;
  label: string;
  href: string;
  icon: string;
  group: string;
  permissionKey: string | null;
  hideIfPermissionKey?: string | null;
  sortOrder: number;
}

export const NAV_SEED: NavSeed[] = [
  { key: "dashboard", label: "Dashboard", href: "/portal", icon: "LayoutDashboard", group: "Overview", permissionKey: null, sortOrder: 10 },

  { key: "properties", label: "Properties", href: "/portal/properties", icon: "Building2", group: "Operations", permissionKey: "property:read", sortOrder: 20 },
  { key: "assigned-properties", label: "Assigned Properties", href: "/portal/properties", icon: "Building2", group: "Operations", permissionKey: "property:assigned_read", hideIfPermissionKey: "property:read", sortOrder: 21 },

  { key: "customers", label: "Customers", href: "/portal/customers", icon: "Users", group: "Operations", permissionKey: "customer:read", sortOrder: 30 },

  { key: "enquiries", label: "Enquiries", href: "/portal/enquiries", icon: "MessageSquare", group: "Operations", permissionKey: "enquiry:read", sortOrder: 40 },
  { key: "property-enquiries", label: "Property Enquiries", href: "/portal/enquiries", icon: "MessageSquare", group: "Operations", permissionKey: "enquiry:property_read", hideIfPermissionKey: "enquiry:read", sortOrder: 41 },
  { key: "assigned-enquiries", label: "Assigned Enquiries", href: "/portal/enquiries", icon: "MessageSquare", group: "Operations", permissionKey: "enquiry:assigned_read", hideIfPermissionKey: "enquiry:read", sortOrder: 42 },

  { key: "bookings", label: "Bookings", href: "/portal/bookings", icon: "CalendarCheck", group: "Operations", permissionKey: "booking:read", sortOrder: 50 },
  { key: "property-bookings", label: "Property Bookings", href: "/portal/bookings", icon: "CalendarCheck", group: "Operations", permissionKey: "booking:property_read", hideIfPermissionKey: "booking:read", sortOrder: 51 },
  { key: "assigned-bookings", label: "Assigned Bookings", href: "/portal/bookings", icon: "CalendarCheck", group: "Operations", permissionKey: "booking:assigned_read", hideIfPermissionKey: "booking:read", sortOrder: 52 },

  { key: "cms", label: "Website CMS", href: "/portal/cms", icon: "FileText", group: "Content", permissionKey: "cms:read", sortOrder: 60 },
  { key: "media", label: "Media Library", href: "/portal/media", icon: "Image", group: "Content", permissionKey: "media:read", sortOrder: 61 },
  { key: "testimonials", label: "Testimonials", href: "/portal/cms/testimonials", icon: "Quote", group: "Content", permissionKey: "cms:testimonials", sortOrder: 62 },
  { key: "faqs", label: "FAQs", href: "/portal/cms/faqs", icon: "HelpCircle", group: "Content", permissionKey: "cms:faqs", sortOrder: 63 },
  { key: "announcements", label: "Announcements", href: "/portal/cms/announcements", icon: "Megaphone", group: "Content", permissionKey: "cms:announcements", sortOrder: 64 },

  { key: "staff", label: "Staff Management", href: "/portal/staff", icon: "UserCog", group: "Administration", permissionKey: "staff:read", sortOrder: 70 },
  { key: "roles", label: "Roles", href: "/portal/roles", icon: "ShieldCheck", group: "Administration", permissionKey: "role:read", sortOrder: 71 },
  { key: "permissions", label: "Permissions", href: "/portal/permissions", icon: "KeyRound", group: "Administration", permissionKey: "permission:read", sortOrder: 72 },

  { key: "notifications", label: "Notifications", href: "/portal/notifications", icon: "Bell", group: "Insights", permissionKey: "notification:read", sortOrder: 80 },
  { key: "reports", label: "Reports", href: "/portal/reports", icon: "BarChart3", group: "Insights", permissionKey: "report:read", sortOrder: 81 },
  { key: "activity-logs", label: "Activity Logs", href: "/portal/activity-logs", icon: "Activity", group: "Insights", permissionKey: "activity:read", sortOrder: 82 },
  { key: "audit-logs", label: "Audit Logs", href: "/portal/audit-logs", icon: "ScrollText", group: "Insights", permissionKey: "audit:read", sortOrder: 83 },

  { key: "company-settings", label: "Company Settings", href: "/portal/settings/company", icon: "Building", group: "Settings", permissionKey: "settings:company", sortOrder: 90 },
  { key: "system-settings", label: "System Settings", href: "/portal/settings/system", icon: "Settings", group: "Settings", permissionKey: "settings:system", sortOrder: 91 },
];

/** Demo accounts created on first boot so every role can be inspected. */
export const USER_SEED = [
  { firstName: "System", lastName: "Owner", email: "superadmin@mcbhlues.com", phone: "+1 (555) 100-0001", role: "super_admin", password: "SuperAdmin@123" },
  { firstName: "Amara", lastName: "Okafor", email: "admin@mcbhlues.com", phone: "+1 (555) 100-0002", role: "admin", password: "Admin@123" },
  { firstName: "Daniel", lastName: "Mensah", email: "propertymanager@mcbhlues.com", phone: "+1 (555) 100-0003", role: "property_manager", password: "Property@123" },
  { firstName: "Grace", lastName: "Bello", email: "salesagent@mcbhlues.com", phone: "+1 (555) 100-0004", role: "sales_agent", password: "Sales@123" },
  { firstName: "Tobi", lastName: "Adeyemi", email: "reception@mcbhlues.com", phone: "+1 (555) 100-0005", role: "reception", password: "Reception@123" },
  { firstName: "Zara", lastName: "Nwosu", email: "contentmanager@mcbhlues.com", phone: "+1 (555) 100-0006", role: "content_manager", password: "Content@123" },
];
