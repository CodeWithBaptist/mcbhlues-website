import { NextResponse } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import { addEnquiryNote, getEnquiryById } from "@/lib/enquiries/enquiry-service";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

/** POST /api/portal/enquiries/:id/notes — internal note. Requires enquiry:notes. */
export const POST = withPermission("enquiry:notes", async (request, { params, user }) => {
  const { id } = await params;
  const existing = await getEnquiryById(id);
  if (!existing) return NextResponse.json({ error: "Enquiry not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const note = typeof body?.body === "string" ? body.body.trim() : "";
  if (!note) return NextResponse.json({ error: "Note body is required." }, { status: 400 });

  const created = await addEnquiryNote(id, note, "note", user);
  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.ENQUIRY_NOTE_ADDED,
    resource: "enquiry",
    resourceId: id,
    metadata: { reference: existing.reference },
  });

  return NextResponse.json({ note: created }, { status: 201 });
});
