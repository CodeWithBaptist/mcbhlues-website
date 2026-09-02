import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { withPermission } from "@/lib/rbac/api-guard";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";
import { assertCanAdministerStaff, issueInvitation } from "@/lib/rbac/staff-service";
import { hoursUntil, sendStaffInviteEmail } from "@/lib/email/staff-emails";

/** POST /api/portal/staff/:id/invite — (re)issue a secure invitation link. */
export const POST = withPermission("staff:invite", async (request, { params, user }) => {
  const { id } = await params;
  await assertCanAdministerStaff(user, id);

  const db = await getDb();
  const [target] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!target) return NextResponse.json({ error: "Staff member not found." }, { status: 404 });

  const issued = await issueInvitation(target.id, target.email, user.id);

  const origin = request.nextUrl.origin;
  const mail = await sendStaffInviteEmail({
    firstName: target.firstName,
    email: target.email,
    inviteUrl: `${origin}${issued.url}`,
    expiresInHours: hoursUntil(issued.expiresAt),
  });

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.STAFF_INVITED,
    resource: "user",
    resourceId: id,
    metadata: { email: target.email, expiresAt: issued.expiresAt.toISOString(), emailStatus: mail.status },
  });

  // The link is emailed when a transport is configured; it is always returned
  // so an admin can copy it manually if delivery is unavailable.
  return NextResponse.json({
    invitation: { url: issued.url, expiresAt: issued.expiresAt },
    emailed: mail.status === "sent",
    emailStatus: mail.status,
  });
});
