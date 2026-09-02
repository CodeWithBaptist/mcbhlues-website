import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { DEFAULT_CURRENCY } from "@/lib/utils";
import {
  properties,
  propertyAmenities,
  propertyAssignments,
  propertyFeatures,
  propertyImages,
} from "@/db/schema";
import type { AuthenticatedUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/rbac/can";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

export interface PropertyImageRow {
  id: string;
  url: string;
  alt: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface PropertyAmenityRow {
  id: string;
  name: string;
  icon: string;
}

export interface PropertyFeatureRow {
  id: string;
  label: string;
}

export interface PropertyWithDetails {
  id: string;
  title: string;
  slug: string;
  description: string;
  type: "sale" | "rent";
  status: string;
  price: number;
  currency: string;
  beds: number;
  baths: number;
  sqft: number;
  yearBuilt: number | null;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude: string;
  longitude: string;
  googleMapsUrl: string;
  isFeatured: boolean;
  isPublished: boolean;
  publishedAt: string | null;
  images: PropertyImageRow[];
  amenities: PropertyAmenityRow[];
  features: PropertyFeatureRow[];
  assignedUserIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PropertyInput {
  title?: string;
  description?: string;
  type?: "sale" | "rent";
  status?: string;
  price?: number;
  currency?: string;
  beds?: number;
  baths?: number;
  sqft?: number;
  yearBuilt?: number | null;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: string;
  longitude?: string;
  googleMapsUrl?: string;
  isFeatured?: boolean;
  isPublished?: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120) || "property";
}

/** Given a base slug, produce one that does not collide with another row. */
async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const db = await getDb();
  let slug = base;
  let index = 2;
  for (;;) {
    const [row] = await db
      .select({ id: properties.id })
      .from(properties)
      .where(excludeId ? and(eq(properties.slug, slug), ne(properties.id, excludeId)) : eq(properties.slug, slug))
      .limit(1);
    if (!row) return slug;
    slug = `${base}-${index++}`;
  }
}

function toImageRow(row: typeof propertyImages.$inferSelect): PropertyImageRow {
  return { id: row.id, url: row.url, alt: row.alt, sortOrder: row.sortOrder, isPrimary: row.isPrimary };
}

async function assemble(
  rows: (typeof properties.$inferSelect)[]
): Promise<PropertyWithDetails[]> {
  if (rows.length === 0) return [];
  const db = await getDb();
  const ids = rows.map((row) => row.id);

  const [imageRows, amenityRows, featureRows, assignmentRows] = await Promise.all([
    db
      .select()
      .from(propertyImages)
      .where(inArray(propertyImages.propertyId, ids))
      .orderBy(asc(propertyImages.sortOrder), asc(propertyImages.createdAt)),
    db
      .select()
      .from(propertyAmenities)
      .where(inArray(propertyAmenities.propertyId, ids))
      .orderBy(asc(propertyAmenities.name)),
    db
      .select()
      .from(propertyFeatures)
      .where(inArray(propertyFeatures.propertyId, ids))
      .orderBy(asc(propertyFeatures.label)),
    db
      .select()
      .from(propertyAssignments)
      .where(inArray(propertyAssignments.propertyId, ids)),
  ]);

  const byProperty = <T extends { propertyId: string }>(list: T[]) => {
    const map = new Map<string, T[]>();
    for (const item of list) {
      const arr = map.get(item.propertyId) ?? [];
      arr.push(item);
      map.set(item.propertyId, arr);
    }
    return map;
  };

  const imagesMap = byProperty(imageRows);
  const amenitiesMap = byProperty(amenityRows);
  const featuresMap = byProperty(featureRows);
  const assignmentsMap = byProperty(assignmentRows);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    type: row.type as "sale" | "rent",
    status: row.status,
    price: row.price,
    currency: row.currency,
    beds: row.beds,
    baths: row.baths,
    sqft: row.sqft,
    yearBuilt: row.yearBuilt,
    address: row.address,
    city: row.city,
    state: row.state,
    postalCode: row.postalCode,
    country: row.country,
    latitude: row.latitude,
    longitude: row.longitude,
    googleMapsUrl: row.googleMapsUrl,
    isFeatured: row.isFeatured,
    isPublished: row.isPublished,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    images: (imagesMap.get(row.id) ?? []).map(toImageRow),
    amenities: (amenitiesMap.get(row.id) ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      icon: item.icon,
    })),
    features: (featuresMap.get(row.id) ?? []).map((item) => ({ id: item.id, label: item.label })),
    assignedUserIds: (assignmentsMap.get(row.id) ?? []).map((item) => item.userId),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

/* -------------------------------------------------------------------------- */
/*  Reads                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Lists the properties the caller may see, honouring the scoped-read
 * permissions. `property:read` sees everything; otherwise only published
 * (available) and/or assigned rows are visible.
 */
export async function loadPropertiesForUser(user: AuthenticatedUser): Promise<PropertyWithDetails[]> {
  const db = await getDb();
  const canSeeAll = hasPermission(user.permissions, "property:read");
  const canSeeAssigned = hasPermission(user.permissions, "property:assigned_read");
  const canSeeAvailable = hasPermission(user.permissions, "property:read_available");

  const rows = await db.select().from(properties).orderBy(asc(properties.createdAt));

  let filtered = rows;
  if (!canSeeAll) {
    const visible = new Set<string>();
    if (canSeeAvailable) {
      for (const row of rows) {
        if (row.isPublished) visible.add(row.id);
      }
    }
    if (canSeeAssigned) {
      const assigned = await db
        .select({ propertyId: propertyAssignments.propertyId })
        .from(propertyAssignments)
        .where(eq(propertyAssignments.userId, user.id));
      for (const row of assigned) visible.add(row.propertyId);
    }
    filtered = rows.filter((row) => visible.has(row.id));
  }

  return assemble(filtered);
}

export async function getPropertyDetails(id: string): Promise<PropertyWithDetails | null> {
  const db = await getDb();
  const [row] = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
  if (!row) return null;
  return (await assemble([row]))[0];
}

export async function getPropertyBySlug(slug: string): Promise<PropertyWithDetails | null> {
  const db = await getDb();
  const [row] = await db.select().from(properties).where(eq(properties.slug, slug)).limit(1);
  if (!row) return null;
  return (await assemble([row]))[0];
}

/** Public website feed — published properties only. */
export async function listPublishedProperties(): Promise<PropertyWithDetails[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(properties)
    .where(eq(properties.isPublished, true))
    .orderBy(desc(properties.createdAt));
  return assemble(rows);
}

/**
 * Lightweight list for the CMS featured-properties picker. Deliberately NOT
 * permission-scoped: `cms:featured_properties` holders (e.g. Content Manager)
 * curate the homepage without necessarily holding any property:* read scope.
 */
export async function listPropertiesForCuration(): Promise<
  { id: string; title: string; city: string; status: string; isPublished: boolean; isFeatured: boolean; imageUrl: string }[]
> {
  const db = await getDb();
  const rows = await db.select().from(properties).orderBy(asc(properties.title));
  if (rows.length === 0) return [];
  const imageRows = await db
    .select()
    .from(propertyImages)
    .where(inArray(propertyImages.propertyId, rows.map((row) => row.id)));
  const primaryBy = new Map<string, string>();
  for (const image of imageRows) {
    if (image.isPrimary && !primaryBy.has(image.propertyId)) primaryBy.set(image.propertyId, image.url);
  }
  for (const image of imageRows) {
    if (!primaryBy.has(image.propertyId)) primaryBy.set(image.propertyId, image.url);
  }
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    city: row.city,
    status: row.status,
    isPublished: row.isPublished,
    isFeatured: row.isFeatured,
    imageUrl: primaryBy.get(row.id) ?? "",
  }));
}

/* -------------------------------------------------------------------------- */
/*  Writes                                                                     */
/* -------------------------------------------------------------------------- */

export async function createProperty(input: PropertyInput & { title: string }, actorId: string): Promise<PropertyWithDetails> {
  const db = await getDb();
  const baseSlug = slugify(input.title);
  const slug = await uniqueSlug(baseSlug);

  const [created] = await db
    .insert(properties)
    .values({
      title: input.title,
      slug,
      description: input.description ?? "",
      type: input.type ?? "sale",
      status: input.status ?? "available",
      price: input.price ?? 0,
      currency: input.currency ?? DEFAULT_CURRENCY,
      beds: input.beds ?? 0,
      baths: input.baths ?? 0,
      sqft: input.sqft ?? 0,
      yearBuilt: input.yearBuilt ?? null,
      address: input.address ?? "",
      city: input.city ?? "",
      state: input.state ?? "",
      postalCode: input.postalCode ?? "",
      country: input.country ?? "",
      latitude: input.latitude ?? "",
      longitude: input.longitude ?? "",
      googleMapsUrl: input.googleMapsUrl ?? "",
      isFeatured: input.isFeatured ?? false,
      isPublished: input.isPublished ?? false,
      publishedAt: input.isPublished ? new Date() : null,
      createdBy: actorId,
    })
    .returning();

  return (await assemble([created]))[0];
}

export async function updateProperty(
  id: string,
  input: PropertyInput,
  actorId: string
): Promise<PropertyWithDetails | null> {
  const db = await getDb();
  const [existing] = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
  if (!existing) return null;

  const patch: Record<string, unknown> = { updatedAt: new Date() };

  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.description !== undefined) patch.description = input.description;
  if (input.type !== undefined) patch.type = input.type;
  if (input.status !== undefined) patch.status = input.status;
  if (input.price !== undefined) patch.price = input.price;
  if (input.currency !== undefined) patch.currency = input.currency;
  if (input.beds !== undefined) patch.beds = input.beds;
  if (input.baths !== undefined) patch.baths = input.baths;
  if (input.sqft !== undefined) patch.sqft = input.sqft;
  if (input.yearBuilt !== undefined) patch.yearBuilt = input.yearBuilt;
  if (input.address !== undefined) patch.address = input.address;
  if (input.city !== undefined) patch.city = input.city;
  if (input.state !== undefined) patch.state = input.state;
  if (input.postalCode !== undefined) patch.postalCode = input.postalCode;
  if (input.country !== undefined) patch.country = input.country;
  if (input.latitude !== undefined) patch.latitude = input.latitude;
  if (input.longitude !== undefined) patch.longitude = input.longitude;
  if (input.googleMapsUrl !== undefined) patch.googleMapsUrl = input.googleMapsUrl;
  if (input.isFeatured !== undefined) patch.isFeatured = input.isFeatured;

  // Publishing state changes the publishedAt stamp.
  if (input.isPublished !== undefined) {
    patch.isPublished = input.isPublished;
    patch.publishedAt = input.isPublished ? (existing.publishedAt ?? new Date()) : null;
  }

  // Keep the slug in sync with the title when the title changes.
  if (patch.title && patch.title !== existing.title) {
    patch.slug = await uniqueSlug(slugify(patch.title as string), id);
  }

  const [updated] = await db.update(properties).set(patch).where(eq(properties.id, id)).returning();
  if (!updated) return null;

  return (await assemble([updated]))[0];
}

export async function deleteProperty(id: string): Promise<boolean> {
  const db = await getDb();
  const [deleted] = await db.delete(properties).where(eq(properties.id, id)).returning({ id: properties.id });
  return Boolean(deleted);
}

export async function setPropertyImages(
  id: string,
  images: { url: string; alt?: string; isPrimary?: boolean }[]
): Promise<PropertyImageRow[]> {
  const db = await getDb();
  await db.delete(propertyImages).where(eq(propertyImages.propertyId, id));
  if (images.length > 0) {
    let primaryAssigned = images.some((image) => image.isPrimary);
    await db.insert(propertyImages).values(
      images.map((image, index) => {
        const isPrimary = image.isPrimary || (!primaryAssigned && index === 0);
        if (isPrimary) primaryAssigned = true;
        return {
          propertyId: id,
          url: image.url.trim(),
          alt: image.alt?.trim() ?? "",
          sortOrder: index,
          isPrimary,
        };
      })
    );
  }
  const rows = await db
    .select()
    .from(propertyImages)
    .where(eq(propertyImages.propertyId, id))
    .orderBy(asc(propertyImages.sortOrder), asc(propertyImages.createdAt));
  return rows.map(toImageRow);
}

export async function setPropertyAmenities(id: string, amenities: { name: string; icon?: string }[]): Promise<PropertyAmenityRow[]> {
  const db = await getDb();
  await db.delete(propertyAmenities).where(eq(propertyAmenities.propertyId, id));
  const cleaned = amenities.map((item) => ({ name: item.name.trim(), icon: item.icon?.trim() ?? "" })).filter((item) => item.name);
  if (cleaned.length > 0) {
    await db
      .insert(propertyAmenities)
      .values(cleaned.map((item) => ({ propertyId: id, ...item })));
  }
  const rows = await db
    .select()
    .from(propertyAmenities)
    .where(eq(propertyAmenities.propertyId, id))
    .orderBy(asc(propertyAmenities.name));
  return rows.map((item) => ({ id: item.id, name: item.name, icon: item.icon }));
}

export async function setPropertyFeatures(id: string, features: string[]): Promise<PropertyFeatureRow[]> {
  const db = await getDb();
  await db.delete(propertyFeatures).where(eq(propertyFeatures.propertyId, id));
  const cleaned = [...new Set(features.map((label) => label.trim()).filter(Boolean))];
  if (cleaned.length > 0) {
    await db.insert(propertyFeatures).values(cleaned.map((label) => ({ propertyId: id, label })));
  }
  const rows = await db
    .select()
    .from(propertyFeatures)
    .where(eq(propertyFeatures.propertyId, id))
    .orderBy(asc(propertyFeatures.label));
  return rows.map((item) => ({ id: item.id, label: item.label }));
}

export async function assignProperty(propertyId: string, userId: string, actorId: string): Promise<void> {
  const db = await getDb();
  await db
    .insert(propertyAssignments)
    .values({ propertyId, userId, assignedBy: actorId })
    .onConflictDoNothing();
}

export async function unassignProperty(propertyId: string, userId: string): Promise<void> {
  const db = await getDb();
  await db
    .delete(propertyAssignments)
    .where(and(eq(propertyAssignments.propertyId, propertyId), eq(propertyAssignments.userId, userId)));
}

export async function getPropertyAssignees(propertyId: string): Promise<string[]> {
  const db = await getDb();
  const rows = await db
    .select({ userId: propertyAssignments.userId })
    .from(propertyAssignments)
    .where(eq(propertyAssignments.propertyId, propertyId));
  return rows.map((row) => row.userId);
}
