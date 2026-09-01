import { NextResponse } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import { getCustomerById, setCustomerSavedProperties } from "@/lib/customers/customer-service";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

/** PUT /api/portal/customers/:id/saved — replace the saved-properties list. */
export const PUT = withPermission("customer:update", async (request, { params, user }) => {
  const { id } = await params;
  const existing = await getCustomerById(id);
  if (!existing) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const propertyIds = Array.isArray(body?.propertyIds)
    ? body.propertyIds.filter((value: unknown): value is string => typeof value === "string")
    : [];

  await setCustomerSavedProperties(id, propertyIds);
  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.CUSTOMER_SAVED_CHANGED,
    resource: "customer",
    resourceId: id,
    metadata: { propertyIds },
  });

  return NextResponse.json({ ok: true, propertyIds });
});
