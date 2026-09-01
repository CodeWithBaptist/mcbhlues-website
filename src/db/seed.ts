import { eq, inArray } from "drizzle-orm";
import type { Database } from "./index";
import {
  announcements,
  bookings,
  customers,
  enquiries,
  faqs,
  mediaAssets,
  navItems,
  notifications,
  permissions,
  properties,
  propertyAmenities,
  propertyFeatures,
  propertyImages,
  rolePermissions,
  roles,
  testimonials,
  userRoles,
  users,
} from "./schema";
import { NAV_SEED, PERMISSION_SEED, ROLE_SEED, USER_SEED } from "./seed-data";
import { PROPERTY_SEED } from "./seed-properties";
import {
  ANNOUNCEMENT_SEED,
  BOOKING_SEED,
  CUSTOMER_SEED,
  ENQUIRY_SEED,
  FAQ_SEED,
  MEDIA_SEED,
  NOTIFICATION_SEED,
  TESTIMONIAL_SEED,
} from "./seed-content";
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

  /* ---- properties ------------------------------------------------------- */
  // The property catalogue is seeded once by slug. Afterwards every property,
  // image, amenity, feature and assignment is ordinary data managed entirely
  // from the Staff Portal — nothing here overrides runtime changes.
  const existingProperties = await db.select({ slug: properties.slug }).from(properties);
  const existingSlugs = new Set(existingProperties.map((row) => row.slug));
  const missing = PROPERTY_SEED.filter((row) => !existingSlugs.has(row.slug));

  for (const seed of missing) {
    const [created] = await db
      .insert(properties)
      .values({
        title: seed.title,
        slug: seed.slug,
        description: seed.description,
        type: seed.type,
        status: seed.status,
        price: seed.price,
        beds: seed.beds,
        baths: seed.baths,
        sqft: seed.sqft,
        yearBuilt: seed.yearBuilt,
        address: seed.address,
        city: seed.city,
        state: seed.state,
        postalCode: seed.postalCode,
        country: seed.country,
        latitude: seed.latitude,
        longitude: seed.longitude,
        isFeatured: seed.isFeatured,
        isPublished: true,
        publishedAt: new Date(),
      })
      .returning({ id: properties.id });

    if (!created) continue;
    await db
      .insert(propertyImages)
      .values(
        seed.images.map((url, index) => ({
          propertyId: created.id,
          url,
          alt: seed.title,
          sortOrder: index,
          isPrimary: index === 0,
        }))
      )
      .onConflictDoNothing();
    await db
      .insert(propertyAmenities)
      .values(
        seed.amenities.map((amenity) => ({
          propertyId: created.id,
          name: amenity.name,
          icon: amenity.icon,
        }))
      )
      .onConflictDoNothing();
    await db
      .insert(propertyFeatures)
      .values(
        seed.features.map((label) => ({
          propertyId: created.id,
          label,
        }))
      )
      .onConflictDoNothing();
  }

  /* ---- staff accounts --------------------------------------------------- */
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

  /* ---- demo operational content ------------------------------------------ */
  // Seeded once per table, only when that table is empty. Portal edits and
  // deletions made afterwards are never overwritten by these rows.
  await seedContent(db, demo);
}

async function seedContent(db: Database, demo: boolean) {
  if (!demo) return; // production deployments start with clean operational tables

  const allUsers = await db.select().from(users);
  const userIdByEmail = new Map(allUsers.map((row) => [row.email, row.id]));
  const allProperties = await db.select().from(properties);
  const propertyIdBySlug = new Map(allProperties.map((row) => [row.slug, row.id]));

  /* ---- customers ---------------------------------------------------------- */
  const customerCount = await db.select({ id: customers.id }).from(customers).limit(1);
  if (customerCount.length === 0) {
    for (const seed of CUSTOMER_SEED) {
      await db.insert(customers).values({
        firstName: seed.firstName,
        lastName: seed.lastName,
        email: seed.email,
        phone: seed.phone,
        type: seed.type,
        status: seed.status,
        source: seed.source,
        budgetMin: seed.budgetMin,
        budgetMax: seed.budgetMax,
        preferredLocation: seed.preferredLocation,
        notes: seed.notes,
        assignedTo: userIdByEmail.get(seed.assignedEmail) ?? null,
      });
    }
  }

  const customersByEmail = new Map(
    (await db.select().from(customers)).map((row) => [row.email, row.id])
  );

  /* ---- enquiries ---------------------------------------------------------- */
  const enquiryCount = await db.select({ id: enquiries.id }).from(enquiries).limit(1);
  if (enquiryCount.length === 0) {
    let counter = 1;
    for (const seed of ENQUIRY_SEED) {
      await db.insert(enquiries).values({
        reference: `ENQ-${String(counter++).padStart(4, "0")}`,
        name: seed.name,
        email: seed.email,
        phone: seed.phone,
        subject: seed.subject,
        message: seed.message,
        type: seed.type,
        source: seed.source,
        status: seed.status,
        priority: seed.priority,
        propertyId: seed.propertySlug ? (propertyIdBySlug.get(seed.propertySlug) ?? null) : null,
        customerId: seed.customerEmail ? (customersByEmail.get(seed.customerEmail) ?? null) : null,
        assignedTo: seed.assignedEmail ? (userIdByEmail.get(seed.assignedEmail) ?? null) : null,
      });
    }
  }

  /* ---- bookings ----------------------------------------------------------- */
  const bookingCount = await db.select({ id: bookings.id }).from(bookings).limit(1);
  if (bookingCount.length === 0) {
    let counter = 1;
    const now = new Date();
    for (const seed of BOOKING_SEED) {
      const scheduledAt = new Date(now);
      scheduledAt.setDate(scheduledAt.getDate() + seed.inDays);
      scheduledAt.setHours(seed.hour, 0, 0, 0);
      await db.insert(bookings).values({
        reference: `BKG-${String(counter++).padStart(4, "0")}`,
        name: seed.name,
        email: seed.email,
        phone: seed.phone,
        type: seed.type,
        status: seed.status,
        scheduledAt,
        durationMinutes: seed.durationMinutes,
        location: seed.location,
        notes: seed.notes,
        propertyId: seed.propertySlug ? (propertyIdBySlug.get(seed.propertySlug) ?? null) : null,
        customerId: seed.customerEmail ? (customersByEmail.get(seed.customerEmail) ?? null) : null,
        assignedTo: seed.assignedEmail ? (userIdByEmail.get(seed.assignedEmail) ?? null) : null,
      });
    }
  }

  /* ---- testimonials -------------------------------------------------------- */
  const testimonialCount = await db.select({ id: testimonials.id }).from(testimonials).limit(1);
  if (testimonialCount.length === 0) {
    await db.insert(testimonials).values(
      TESTIMONIAL_SEED.map((seed) => ({
        name: seed.name,
        role: seed.role,
        quote: seed.quote,
        rating: seed.rating,
        sortOrder: seed.sortOrder,
        isPublished: true,
      }))
    );
  }

  /* ---- faqs ---------------------------------------------------------------- */
  const faqCount = await db.select({ id: faqs.id }).from(faqs).limit(1);
  if (faqCount.length === 0) {
    await db.insert(faqs).values(
      FAQ_SEED.map((seed) => ({
        question: seed.question,
        answer: seed.answer,
        category: seed.category,
        sortOrder: seed.sortOrder,
        isPublished: true,
      }))
    );
  }

  /* ---- announcements -------------------------------------------------------- */
  const announcementCount = await db.select({ id: announcements.id }).from(announcements).limit(1);
  if (announcementCount.length === 0) {
    await db.insert(announcements).values(
      ANNOUNCEMENT_SEED.map((seed) => ({
        title: seed.title,
        body: seed.body,
        tone: seed.tone,
        isActive: seed.isActive,
      }))
    );
  }

  /* ---- media assets --------------------------------------------------------- */
  const mediaCount = await db.select({ id: mediaAssets.id }).from(mediaAssets).limit(1);
  if (mediaCount.length === 0) {
    await db.insert(mediaAssets).values(
      MEDIA_SEED.map((seed) => ({
        title: seed.title,
        url: seed.url,
        kind: seed.kind,
        folder: seed.folder,
        alt: seed.alt,
      }))
    );
  }

  /* ---- notifications ---------------------------------------------------------- */
  const notificationCount = await db.select({ id: notifications.id }).from(notifications).limit(1);
  if (notificationCount.length === 0) {
    for (const seed of NOTIFICATION_SEED) {
      await db.insert(notifications).values({
        userId: seed.userEmail ? (userIdByEmail.get(seed.userEmail) ?? null) : null,
        title: seed.title,
        body: seed.body,
        kind: seed.kind,
        link: seed.link,
      });
    }
  }
}
