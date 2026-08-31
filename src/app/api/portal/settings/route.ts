import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { settings } from "@/db/schema";
import { withPermission } from "@/lib/rbac/api-guard";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

const SCOPE_PERMISSION: Record<string, string> = {
  company: "settings:company",
  system: "settings:system",
};

/** GET /api/portal/settings?scope=company|system */
export const GET = withPermission(["settings:read", "settings:company", "settings:system"], async (request, { user }) => {
  const scope = request.nextUrl.searchParams.get("scope") ?? "company";
  const required = SCOPE_PERMISSION[scope];
  if (required && !user.permissions.includes(required) && !user.permissions.includes("settings:read")) {
    return NextResponse.json({ error: "Not permitted.", code: "FORBIDDEN" }, { status: 403 });
  }

  const db = await getDb();
  const rows = await db.select().from(settings).where(eq(settings.scope, scope));
  return NextResponse.json({ settings: rows });
});

/** PUT — persist a settings key. Scope decides which permission is required. */
export const PUT = withPermission(["settings:company", "settings:system", "settings:update"], async (request, { user }) => {
  const body = await request.json().catch(() => null);
  const scope = body?.scope === "system" ? "system" : "company";
  const key = String(body?.key ?? "").trim();
  if (!key) return NextResponse.json({ error: "A settings key is required." }, { status: 400 });

  const required = SCOPE_PERMISSION[scope];
  if (!user.permissions.includes(required)) {
    return NextResponse.json(
      { error: "Not permitted.", code: "FORBIDDEN", requiredPermissions: [required] },
      { status: 403 }
    );
  }

  const db = await getDb();
  const [existing] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  if (existing) {
    await db
      .update(settings)
      .set({ value: body?.value ?? null, scope, updatedBy: user.id, updatedAt: new Date() })
      .where(eq(settings.key, key));
  } else {
    await db.insert(settings).values({ key, value: body?.value ?? null, scope, updatedBy: user.id });
  }

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.SETTINGS_CHANGED,
    resource: "settings",
    resourceId: key,
    metadata: { scope, value: body?.value ?? null },
  });

  return NextResponse.json({ ok: true });
});
