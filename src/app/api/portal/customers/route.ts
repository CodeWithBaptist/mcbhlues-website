import { NextResponse } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import { createCustomer, loadCustomersForUser } from "@/lib/customers/customer-service";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

/**
 * GET /api/portal/customers — list customers, honouring customer:read /
 * customer:assigned_read scoping.
 */
export const GET = withPermission(["customer:read", "customer:assigned_read"], async (_request, { user }) => {
  const list = await loadCustomersForUser(user);
  return NextResponse.json({ customers: list });
});

/** POST /api/portal/customers — create a customer. Requires customer:create. */
export const POST = withPermission("customer:create", async (request, { user }) => {
  const body = await request.json().catch(() => null);
  const firstName = typeof body?.firstName === "string" ? body.firstName.trim() : "";
  if (!firstName) {
    return NextResponse.json({ error: "First name is required." }, { status: 400 });
  }

  const customer = await createCustomer(
    {
      firstName,
      lastName: typeof body?.lastName === "string" ? body.lastName : "",
      email: typeof body?.email === "string" ? body.email : "",
      phone: typeof body?.phone === "string" ? body.phone : "",
      type: typeof body?.type === "string" ? body.type : "buyer",
      status: typeof body?.status === "string" ? body.status : "active",
      source: typeof body?.source === "string" ? body.source : "",
      budgetMin: Number.isFinite(Number(body?.budgetMin)) ? Number(body?.budgetMin) : 0,
      budgetMax: Number.isFinite(Number(body?.budgetMax)) ? Number(body?.budgetMax) : 0,
      preferredLocation: typeof body?.preferredLocation === "string" ? body.preferredLocation : "",
      notes: typeof body?.notes === "string" ? body.notes : "",
      assignedTo: typeof body?.assignedTo === "string" && body.assignedTo ? body.assignedTo : null,
    },
    user.id
  );

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.CUSTOMER_CREATED,
    resource: "customer",
    resourceId: customer.id,
    metadata: { name: `${customer.firstName} ${customer.lastName}`.trim(), type: customer.type },
  });

  return NextResponse.json({ customer }, { status: 201 });
});
