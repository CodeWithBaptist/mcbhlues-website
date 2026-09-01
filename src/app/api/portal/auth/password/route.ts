import { NextResponse, type NextRequest } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { getDb } from "@/db";
import { sessions, users } from "@/db/schema";
import { withAuth } from "@/lib/rbac/api-guard";
import { hashPassword, validatePasswordStrength, verifyPassword } from "@/lib/auth/password";
import { AUDIT_ACTIONS, recordAudit, recordActivity } from "@/lib/rbac/audit";

/**
 * POST /api/portal/auth/password — change your own password.
 * Requires an active session. Verifies the current password before applying
 * the new one, then revokes every *other* session (keeping the current one
 * signed in) so the user is never locked out.
 */
export const POST = withAuth(async (request: NextRequest, { user }) => {
  const body = await request.json().catch(() => null);
  const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { error: "Current password and new password are required." },
      { status: 400 }
    );
  }

  const policy = validatePasswordStrength(newPassword);
  if (!policy.valid) {
    return NextResponse.json({ error: policy.errors.join(" ") }, { status: 400 });
  }

  const db = await getDb();
  const [record] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  if (!record) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  const ok = await verifyPassword(currentPassword, record.passwordHash);
  if (!ok) {
    await recordActivity({
      actor: user,
      action: "auth.password_change_failed",
      description: "Attempted to change password with an incorrect current password",
    });
    return NextResponse.json(
      { error: "Your current password is incorrect." },
      { status: 400 }
    );
  }

  // Apply the new password.
  await db
    .update(users)
    .set({ passwordHash: await hashPassword(newPassword), updatedAt: new Date() })
    .where(eq(users.id, user.id));

  // Revoke all OTHER sessions so a leaked session dies, but keep the current
  // session valid — changing your password should never log you out.
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.userId, user.id), ne(sessions.id, user.sessionId)));

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.PASSWORD_CHANGED,
    resource: "user",
    resourceId: user.id,
  });
  await recordActivity({
    actor: user,
    action: "auth.password_changed",
    description: "Changed own password",
  });

  return NextResponse.json({ ok: true });
});
