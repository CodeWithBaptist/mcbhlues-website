import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { settings } from "@/db/schema";
import { withPermission } from "@/lib/rbac/api-guard";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";
import { MASKED_VALUE, isSensitiveKey } from "@/lib/settings/secrets";

const SCOPE_PERMISSION: Record<string, string> = {
  company: "settings:company",
  system: "settings:system",
  security: "settings:security",
};

const SCOPES = new Set(Object.keys(SCOPE_PERMISSION));

/** GET /api/portal/settings?scope=company|system|security */
export const GET = withPermission(
  ["settings:read", "settings:company", "settings:system", "settings:security"],
  async (request, { user }) => {
    const scope = request.nextUrl.searchParams.get("scope") ?? "company";
    const required = SCOPE_PERMISSION[scope];
    if (!required) {
      return NextResponse.json({ error: "Unknown settings scope." }, { status: 400 });
    }
    if (!user.permissions.includes(required) && !user.permissions.includes("settings:read")) {
      return NextResponse.json({ error: "Not permitted.", code: "FORBIDDEN" }, { status: 403 });
    }

    const db = await getDb();
    const rows = await db.select().from(settings).where(eq(settings.scope, scope));
    // Secrets (SMTP password, API keys…) are never echoed back — a masked
    // placeholder shows in their place.
    const safe = rows.map((row) => ({
      ...row,
      value:
        isSensitiveKey(row.key) && row.value != null && String(row.value) !== ""
          ? MASKED_VALUE
          : row.value,
    }));
    return NextResponse.json({ settings: safe });
  }
);

/** PUT — persist a settings key. Scope decides which permission is required. */
export const PUT = withPermission(
  ["settings:company", "settings:system", "settings:security", "settings:update"],
  async (request, { user }) => {
    const body = await request.json().catch(() => null);
    const scope = typeof body?.scope === "string" && SCOPES.has(body.scope) ? body.scope : "company";
    const key = String(body?.key ?? "").trim();
    if (!key) return NextResponse.json({ error: "A settings key is required." }, { status: 400 });

    const required = SCOPE_PERMISSION[scope];
    if (!user.permissions.includes(required)) {
      return NextResponse.json(
        { error: "Not permitted.", code: "FORBIDDEN", requiredPermissions: [required] },
        { status: 403 }
      );
    }

    // A masked value being sent back means "keep what is stored" — never
    // overwrite a secret with its own placeholder.
    if (isSensitiveKey(key) && body?.value === MASKED_VALUE) {
      return NextResponse.json({ ok: true, unchanged: true });
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
      // Never write secrets into the audit trail.
      metadata: { scope, value: isSensitiveKey(key) ? "••••" : (body?.value ?? null) },
    });

    return NextResponse.json({ ok: true });
  }
);
