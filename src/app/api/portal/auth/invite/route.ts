import { NextResponse, type NextRequest } from "next/server";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { invitations, users } from "@/db/schema";
import { hashPassword, hashToken, validatePasswordStrength } from "@/lib/auth/password";
import { getPasswordMinLength } from "@/lib/settings/system-config";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

/** GET /api/portal/auth/invite?token=... — validate an invitation token. */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  if (!token) return NextResponse.json({ error: "Missing token." }, { status: 400 });

  const db = await getDb();
  const [invite] = await db
    .select({ email: invitations.email, firstName: users.firstName, lastName: users.lastName })
    .from(invitations)
    .innerJoin(users, eq(users.id, invitations.userId))
    .where(
      and(
        eq(invitations.tokenHash, hashToken(token)),
        isNull(invitations.acceptedAt),
        isNull(invitations.revokedAt),
        gt(invitations.expiresAt, sql`now()`)
      )
    )
    .limit(1);

  if (!invite) {
    return NextResponse.json({ error: "This invitation is invalid or has expired." }, { status: 404 });
  }
  return NextResponse.json(invite);
}

/** POST — the staff member sets their own password and activates the account. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!token || !password) {
    return NextResponse.json({ error: "Token and password are required." }, { status: 400 });
  }

  const policy = validatePasswordStrength(password, await getPasswordMinLength());
  if (!policy.valid) {
    return NextResponse.json({ error: policy.errors.join(" ") }, { status: 400 });
  }

  const db = await getDb();
  const [invite] = await db
    .select()
    .from(invitations)
    .where(
      and(
        eq(invitations.tokenHash, hashToken(token)),
        isNull(invitations.acceptedAt),
        isNull(invitations.revokedAt),
        gt(invitations.expiresAt, sql`now()`)
      )
    )
    .limit(1);

  if (!invite) {
    return NextResponse.json({ error: "This invitation is invalid or has expired." }, { status: 404 });
  }

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(password), status: "active", updatedAt: new Date() })
    .where(eq(users.id, invite.userId));

  await db
    .update(invitations)
    .set({ acceptedAt: new Date() })
    .where(eq(invitations.id, invite.id));

  await recordAudit({
    actor: { id: invite.userId, email: invite.email },
    action: AUDIT_ACTIONS.INVITE_ACCEPTED,
    resource: "user",
    resourceId: invite.userId,
    metadata: { invitationId: invite.id },
  });

  return NextResponse.json({ ok: true });
}
