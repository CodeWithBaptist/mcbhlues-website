import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { AUDIT_ACTIONS, recordActivity, recordAudit } from "@/lib/rbac/audit";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const db = await getDb();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

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
