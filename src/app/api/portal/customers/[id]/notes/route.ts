import { NextResponse } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import { addCustomerNote, getCustomerById } from "@/lib/customers/customer-service";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

/** POST /api/portal/customers/:id/notes — add an internal note. Requires customer:notes. */
export const POST = withPermission("customer:notes", async (request, { params, user }) => {
  const { id } = await params;
  const existing = await getCustomerById(id);
  if (!existing) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const note = typeof body?.body === "string" ? body.body.trim() : "";
  if (!note) return NextResponse.json({ error: "Note body is required." }, { status: 400 });

  const created = await addCustomerNote(id, note, user);
  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.CUSTOMER_NOTE_ADDED,
    resource: "customer",
    resourceId: id,
  });

  return NextResponse.json({ note: created }, { status: 201 });
});
