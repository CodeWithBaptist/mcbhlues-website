import { NextResponse, type NextRequest } from "next/server";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { invitations, users } from "@/db/schema";
import { hashPassword, hashToken, validatePasswordStrength } from "@/lib/auth/password";
import { getPasswordMinLength } from "@/lib/settings/system-config";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

/**
 * Invitations are single-use tokens delivered over email, but the endpoint is
 * public so we apply per-IP rate limiting to block online brute-force guessing.
 */
const INVITE_BURST = { limit: 20, windowMs: 15 * 60 * 1000 };

/** GET /api/portal/auth/invite?token=... — validate an invitation token. */
export async function GET(request: NextRequest) {
  const ip = clientIp(request);
  const burst = rateLimit(`invite:${ip}`, INVITE_BURST);
  if (!burst.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(burst.retryAfter) } }
    );
  }

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
  const ip = clientIp(request);
  const burst = rateLimit(`invite:${ip}`, INVITE_BURST);
  if (!burst.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(burst.retryAfter) } }
    );
  }

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
