import { NextResponse, type NextRequest } from "next/server";
import { and, count, eq, gt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { auditLogs, users } from "@/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { AUDIT_ACTIONS, recordActivity, recordAudit } from "@/lib/rbac/audit";
import { getSecurityPolicy } from "@/lib/settings/system-config";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  // Brute-force protection, driven by System Settings → Authentication & security.
  const policy = await getSecurityPolicy();
  if (policy.maxFailedLogins > 0) {
    const since = new Date(Date.now() - policy.lockoutMinutes * 60_000);
    const [recent] = await db
      .select({ value: count() })
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.action, AUDIT_ACTIONS.LOGIN_FAILED),
          gt(auditLogs.createdAt, since),
          sql`${auditLogs.metadata} ->> 'email' = ${email}`
        )
      );

    if ((recent?.value ?? 0) >= policy.maxFailedLogins) {
      return NextResponse.json(
        {
          error: `Too many failed sign-in attempts. Try again in ${policy.lockoutMinutes} minutes.`,
          code: "LOCKED_OUT",
        },
        { status: 429 }
      );
    }
  }

  const passwordOk = user ? await verifyPassword(password, user.passwordHash) : false;

  // Uniform failure response — never reveal whether the account exists.
  if (!user || !passwordOk) {
    await recordAudit({
      actor: null,
      action: AUDIT_ACTIONS.LOGIN_FAILED,
      resource: "user",
      resourceId: user?.id ?? null,
      metadata: { email },
    });
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  if (user.status === "invited") {
    return NextResponse.json(
      { error: "This account has not been activated yet. Please use your invitation link." },
      { status: 403 }
    );
  }

  if (user.status !== "active") {
    return NextResponse.json({ error: "This account has been disabled." }, { status: 403 });
  }

  await createSession(user.id);

  const actor = { id: user.id, email: user.email };
  await recordAudit({
    actor,
    action: AUDIT_ACTIONS.LOGIN_SUCCEEDED,
    resource: "user",
    resourceId: user.id,
  });
  await recordActivity({ actor, action: "auth.login", description: "Signed in to the Staff Portal" });

  return NextResponse.json({ ok: true });
}
