import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { withPermission } from "@/lib/rbac/api-guard";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";
import { assertCanAdministerStaff, issueInvitation } from "@/lib/rbac/staff-service";

/** POST /api/portal/staff/:id/invite — (re)issue a secure invitation link. */
export const POST = withPermission("staff:invite", async (_request, { params, user }) => {
  const { id } = await params;
  await assertCanAdministerStaff(user, id);

  const db = await getDb();
  const [target] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!target) return NextResponse.json({ error: "Staff member not found." }, { status: 404 });

  const issued = await issueInvitation(target.id, target.email, user.id);

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.STAFF_INVITED,
    resource: "user",
    resourceId: id,
    metadata: { email: target.email, expiresAt: issued.expiresAt.toISOString() },
  });

  // In production this link is emailed; it is returned here so the Super Admin
  // can copy it while no mail transport is configured.
  return NextResponse.json({ invitation: { url: issued.url, expiresAt: issued.expiresAt } });
});
