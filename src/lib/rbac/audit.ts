import { headers } from "next/headers";
import { getDb } from "@/db";
import { activityLogs, auditLogs } from "@/db/schema";
import type { AuthenticatedUser } from "@/lib/auth/session";

interface AuditInput {
  actor: Pick<AuthenticatedUser, "id" | "email"> | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown>;
}

async function meta() {
  try {
    const headerList = await headers();
    return {
      ip:
        headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        headerList.get("x-real-ip") ??
        "",
      userAgent: headerList.get("user-agent") ?? "",
    };
  } catch {
    return { ip: "", userAgent: "" };
  }
}

/**
 * Audit log — sensitive administrative actions (who / what / where / when).
 * Failures are swallowed so logging can never break the action itself.
 */
export async function recordAudit({ actor, action, resource, resourceId, metadata }: AuditInput) {
  try {
    const db = await getDb();
    const { ip, userAgent } = await meta();
    await db.insert(auditLogs).values({
      userId: actor?.id ?? null,
      userEmail: actor?.email ?? "system",
      action,
      resource,
      resourceId: resourceId ?? null,
      metadata: metadata ?? null,
      ipAddress: ip,
      userAgent,
    });
  } catch (error) {
    console.error("[audit] failed to record", action, error);
  }
}

interface ActivityInput {
  actor: Pick<AuthenticatedUser, "id" | "email"> | null;
  action: string;
  description?: string;
  path?: string;
  metadata?: Record<string, unknown>;
}

/** Activity log — day-to-day staff activity (logins, views, routine updates). */
export async function recordActivity({
  actor,
  action,
  description,
  path,
  metadata,
}: ActivityInput) {
  try {
    const db = await getDb();
    const { ip } = await meta();
    await db.insert(activityLogs).values({
      userId: actor?.id ?? null,
      userEmail: actor?.email ?? "system",
      action,
      description: description ?? "",
      path: path ?? "",
      metadata: metadata ?? null,
      ipAddress: ip,
    });
  } catch (error) {
    console.error("[activity] failed to record", action, error);
  }
}

/** Canonical audit action names for the sensitive operations we track. */
export const AUDIT_ACTIONS = {
  STAFF_CREATED: "staff.created",
  STAFF_INVITED: "staff.invited",
  STAFF_UPDATED: "staff.updated",
  STAFF_DISABLED: "staff.disabled",
  STAFF_ENABLED: "staff.enabled",
  STAFF_REMOVED: "staff.removed",
  STAFF_PASSWORD_RESET: "staff.password_reset",
  STAFF_ROLE_CHANGED: "staff.role_changed",
  STAFF_PERMISSIONS_CHANGED: "staff.permissions_changed",
  ROLE_CREATED: "role.created",
  ROLE_UPDATED: "role.updated",
  ROLE_DELETED: "role.deleted",
  ROLE_PERMISSIONS_CHANGED: "role.permissions_changed",
  PERMISSION_CREATED: "permission.created",
  PERMISSION_UPDATED: "permission.updated",
  PROPERTY_CREATED: "property.created",
  PROPERTY_UPDATED: "property.updated",
  PROPERTY_DELETED: "property.deleted",
  PROPERTY_PUBLISHED: "property.published",
  PROPERTY_UNPUBLISHED: "property.unpublished",
  PROPERTY_STATUS_CHANGED: "property.status_changed",
  PROPERTY_PRICE_CHANGED: "property.price_changed",
  PROPERTY_IMAGES_CHANGED: "property.images_changed",
  PROPERTY_AMENITIES_CHANGED: "property.amenities_changed",
  PROPERTY_FEATURES_CHANGED: "property.features_changed",
  PROPERTY_LOCATION_CHANGED: "property.location_changed",
  PROPERTY_ASSIGNED: "property.assigned",
  PROPERTY_UNASSIGNED: "property.unassigned",
  PASSWORD_CHANGED: "auth.password_changed",
  CUSTOMER_CREATED: "customer.created",
  CUSTOMER_UPDATED: "customer.updated",
  CUSTOMER_DELETED: "customer.deleted",
  CUSTOMER_NOTE_ADDED: "customer.note_added",
  CUSTOMER_SAVED_CHANGED: "customer.saved_changed",
  ENQUIRY_CREATED: "enquiry.created",
  ENQUIRY_UPDATED: "enquiry.updated",
  ENQUIRY_DELETED: "enquiry.deleted",
  ENQUIRY_ASSIGNED: "enquiry.assigned",
  ENQUIRY_RESPONDED: "enquiry.responded",
  ENQUIRY_STATUS_CHANGED: "enquiry.status_changed",
  ENQUIRY_NOTE_ADDED: "enquiry.note_added",
  BOOKING_CREATED: "booking.created",
  BOOKING_UPDATED: "booking.updated",
  BOOKING_DELETED: "booking.deleted",
  BOOKING_STATUS_CHANGED: "booking.status_changed",
  BOOKING_RESCHEDULED: "booking.rescheduled",
  BOOKING_ASSIGNED: "booking.assigned",
  CMS_CONTENT_UPDATED: "cms.content_updated",
  CMS_TESTIMONIAL_CREATED: "cms.testimonial_created",
  CMS_TESTIMONIAL_UPDATED: "cms.testimonial_updated",
  CMS_TESTIMONIAL_DELETED: "cms.testimonial_deleted",
  CMS_FAQ_CREATED: "cms.faq_created",
  CMS_FAQ_UPDATED: "cms.faq_updated",
  CMS_FAQ_DELETED: "cms.faq_deleted",
  CMS_ANNOUNCEMENT_CREATED: "cms.announcement_created",
  CMS_ANNOUNCEMENT_UPDATED: "cms.announcement_updated",
  CMS_ANNOUNCEMENT_DELETED: "cms.announcement_deleted",
  MEDIA_ADDED: "media.added",
  MEDIA_UPDATED: "media.updated",
  MEDIA_DELETED: "media.deleted",
  NOTIFICATION_CREATED: "notification.created",
  EMAIL_TEMPLATE_UPDATED: "settings.email_template_updated",
  SETTINGS_CHANGED: "settings.changed",
  LOGIN_SUCCEEDED: "auth.login_succeeded",
  LOGIN_FAILED: "auth.login_failed",
  LOGOUT: "auth.logout",
  INVITE_ACCEPTED: "auth.invite_accepted",
} as const;
