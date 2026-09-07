import { NextResponse } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import { getLegalDocs, isLegalSlug, resetLegalDoc, saveLegalDoc } from "@/lib/legal/legal-docs";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

function asText(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function validIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/** GET /api/portal/cms/legal — every legal document with current values. */
export const GET = withPermission(["cms:legal", "cms:read"], async () => {
  const docs = await getLegalDocs();
  return NextResponse.json({ docs });
});

/** PUT /api/portal/cms/legal — save one document's fields. Requires cms:legal. */
export const PUT = withPermission("cms:legal", async (request, { user }) => {
  const body = await request.json().catch(() => null);
  const slug = asText(body?.slug) ?? "";
  if (!isLegalSlug(slug)) {
    return NextResponse.json({ error: "Unknown legal document." }, { status: 404 });
  }

  const title = asText(body?.title);
  const summary = asText(body?.summary);
  const text = asText(body?.body);
  const lastUpdated = asText(body?.lastUpdated);

  if (title !== undefined && !title.trim()) {
    return NextResponse.json({ error: "The page title cannot be empty." }, { status: 400 });
  }
  if (summary !== undefined && !summary.trim()) {
    return NextResponse.json({ error: "The page summary cannot be empty." }, { status: 400 });
  }
  if (text !== undefined && !text.trim()) {
    return NextResponse.json({ error: "The policy text cannot be empty." }, { status: 400 });
  }
  if (lastUpdated !== undefined && !validIsoDate(lastUpdated)) {
    return NextResponse.json(
      { error: "The last-updated date must be a valid YYYY-MM-DD date." },
      { status: 400 }
    );
  }
  if (title === undefined && summary === undefined && text === undefined && lastUpdated === undefined) {
    return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
  }

  const doc = await saveLegalDoc(
    slug,
    { title, summary, body: text, updated: lastUpdated },
    user.id
  );

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.CMS_LEGAL_UPDATED,
    resource: "legal_document",
    resourceId: slug,
    metadata: {
      fields: [title, summary, text, lastUpdated].map((field) => field !== undefined),
      length: (text ?? doc.body).length,
    },
  });

  return NextResponse.json({ doc });
});

/**
 * DELETE /api/portal/cms/legal?slug=privacy — discard every saved override so
 * the document falls back to its default text. Requires cms:legal.
 */
export const DELETE = withPermission("cms:legal", async (request, { user }) => {
  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  if (!isLegalSlug(slug)) {
    return NextResponse.json({ error: "Unknown legal document." }, { status: 404 });
  }

  const doc = await resetLegalDoc(slug);

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.CMS_LEGAL_RESET,
    resource: "legal_document",
    resourceId: slug,
  });

  return NextResponse.json({ doc });
});
