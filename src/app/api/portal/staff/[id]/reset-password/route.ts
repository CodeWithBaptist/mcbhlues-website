import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { withPermission } from "@/lib/rbac/api-guard";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";
import { assertCanAdministerStaff, issueInvitation } from "@/lib/rbac/staff-service";
import { revokeUserSessions } from "@/lib/auth/session";

/**
 * POST /api/portal/staff/:id/reset-password
 * Clears the current password, revokes every active session and issues a fresh
 * secure link so the staff member sets their own password. Requires
 * staff:reset_password.
 */
export const POST = withPermission("staff:reset_password", async (_request, { params, user }) => {
  const { id } = await params;

  // Resetting your OWN password used to set the account to "invited", clear the
  // password hash and revoke every session — which locks you out and forces a
  // fresh invitation link. Instead, self-service password changes go through
  // the "Change Password" screen, which keeps you signed in.
  if (id === user.id) {
    return NextResponse.json(
      {
        error:
          "Use 'Change Password' (under your Account menu) to set a new password for yourself — this keeps you signed in.",
        code: "SELF_RESET",
      },
      { status: 400 }
    );
  }

  await assertCanAdministerStaff(user, id);

  const db = await getDb();
  const [target] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  if (!target) return NextResponse.json({ error: "Staff member not found." }, { status: 404 });

  await db
    .update(users)
    .set({ passwordHash: null, status: "invited", updatedAt: new Date() })
    .where(eq(users.id, id));
  await revokeUserSessions(id);

  const issued = await issueInvitation(target.id, target.email, user.id);

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.STAFF_PASSWORD_RESET,
    resource: "user",
    resourceId: id,
    metadata: { email: target.email },
  });

  return NextResponse.json({ invitation: { url: issued.url, expiresAt: issued.expiresAt } });
});
