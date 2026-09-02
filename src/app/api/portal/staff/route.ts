import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { userRoles, users } from "@/db/schema";
import { withPermission } from "@/lib/rbac/api-guard";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";
import { assertCanAssignRole, issueInvitation, listStaff } from "@/lib/rbac/staff-service";
import { hoursUntil, sendStaffInviteEmail } from "@/lib/email/staff-emails";

/** GET /api/portal/staff — requires staff:read */
export const GET = withPermission("staff:read", async () => {
  return NextResponse.json({ staff: await listStaff() });
});

/**
 * POST /api/portal/staff — create a staff account and (optionally) invite them.
 * Requires staff:create.
 */
export const POST = withPermission("staff:create", async (request, { user }) => {
  const body = await request.json().catch(() => null);
  const firstName = String(body?.firstName ?? "").trim();
  const lastName = String(body?.lastName ?? "").trim();
  const email = String(body?.email ?? "").trim().toLowerCase();
  const phone = String(body?.phone ?? "").trim();
  const roleIds: string[] = Array.isArray(body?.roleIds) ? body.roleIds.map(String) : [];
  const sendInvite = body?.sendInvite !== false;

  if (!firstName || !lastName || !email) {
    return NextResponse.json(
      { error: "First name, last name and email are required." },
      { status: 400 }
    );
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const db = await getDb();
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return NextResponse.json({ error: "A staff account with that email already exists." }, { status: 409 });
  }

  // Assigning a role you outrank is itself a privileged operation.
  if (roleIds.length > 0 && !user.permissions.includes("staff:assign_role")) {
    return NextResponse.json(
      { error: "You do not have permission to assign roles.", code: "FORBIDDEN" },
      { status: 403 }
    );
  }
  for (const roleId of roleIds) {
    await assertCanAssignRole(user, roleId);
  }

  const [created] = await db
    .insert(users)
    .values({ firstName, lastName, email, phone, status: "invited", createdBy: user.id })
    .returning();

  if (roleIds.length > 0) {
    await db
      .insert(userRoles)
      .values(roleIds.map((roleId) => ({ userId: created.id, roleId, assignedBy: user.id })));
  }

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.STAFF_CREATED,
    resource: "user",
    resourceId: created.id,
    metadata: { email, roleIds },
  });

  let invitation: { url: string; expiresAt: Date } | null = null;
  let emailed = false;
  if (sendInvite && user.permissions.includes("staff:invite")) {
    const issued = await issueInvitation(created.id, email, user.id);
    invitation = { url: issued.url, expiresAt: issued.expiresAt };

    const origin = request.nextUrl.origin;
    const mail = await sendStaffInviteEmail({
      firstName,
      email,
      inviteUrl: `${origin}${issued.url}`,
      expiresInHours: hoursUntil(issued.expiresAt),
    });
    emailed = mail.status === "sent";

    await recordAudit({
      actor: user,
      action: AUDIT_ACTIONS.STAFF_INVITED,
      resource: "user",
      resourceId: created.id,
      metadata: { email, expiresAt: issued.expiresAt.toISOString(), emailStatus: mail.status },
    });
  }

  const { passwordHash: _passwordHash, ...safeStaff } = created;
  return NextResponse.json({ staff: safeStaff, invitation, emailed }, { status: 201 });
});
