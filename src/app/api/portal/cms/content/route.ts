import { NextResponse } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import { CMS_BLOCKS, getCmsBlocks, setCmsBlock } from "@/lib/cms/cms-service";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

/** Which permission edits which block section — enforced per key. */
const SECTION_PERMISSION: Record<string, string> = {
  homepage: "cms:homepage",
  about: "cms:about",
  services: "cms:services",
  contact: "cms:contact",
  general: "cms:update",
};

/** GET /api/portal/cms/content — every block with its current value. */
export const GET = withPermission("cms:read", async () => {
  const blocks = await getCmsBlocks();
  return NextResponse.json({ blocks });
});

/** PUT /api/portal/cms/content { key, value } — edit one block. */
export const PUT = withPermission(
  ["cms:update", "cms:homepage", "cms:about", "cms:services", "cms:contact"],
  async (request, { user }) => {
    const body = await request.json().catch(() => null);
    const key = typeof body?.key === "string" ? body.key : "";
    const value = typeof body?.value === "string" ? body.value : "";

    const block = CMS_BLOCKS.find((item) => item.key === key);
    if (!block) return NextResponse.json({ error: "Unknown content block." }, { status: 404 });

    const required = SECTION_PERMISSION[block.section] ?? "cms:update";
    if (!user.permissions.includes("cms:update") && !user.permissions.includes(required)) {
      return NextResponse.json(
        { error: "Not permitted.", requiredPermissions: [required] },
        { status: 403 }
      );
    }

    await setCmsBlock(key, value, user.id);
    await recordAudit({
      actor: user,
      action: AUDIT_ACTIONS.CMS_CONTENT_UPDATED,
      resource: "cms_content",
      resourceId: key,
      metadata: { section: block.section, length: value.length },
    });

    return NextResponse.json({ ok: true });
  }
);
