import { NextResponse } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import {
  deleteCustomer,
  getCustomerById,
  getCustomerDetails,
  updateCustomer,
} from "@/lib/customers/customer-service";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";

function num(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** GET /api/portal/customers/:id — notes, saved properties, related records. */
export const GET = withPermission(["customer:read", "customer:assigned_read"], async (_request, { params }) => {
  const { id } = await params;
  const customer = await getCustomerDetails(id);
  if (!customer) return NextResponse.json({ error: "Customer not found." }, { status: 404 });
  return NextResponse.json({ customer });
});

/** PATCH /api/portal/customers/:id — edit a customer. Requires customer:update. */
export const PATCH = withPermission("customer:update", async (request, { params, user }) => {
  const { id } = await params;
  const existing = await getCustomerById(id);
  if (!existing) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const customer = await updateCustomer(id, {
    firstName: typeof body?.firstName === "string" ? body.firstName : undefined,
    lastName: typeof body?.lastName === "string" ? body.lastName : undefined,
    email: typeof body?.email === "string" ? body.email : undefined,
    phone: typeof body?.phone === "string" ? body.phone : undefined,
    type: typeof body?.type === "string" ? body.type : undefined,
    status: typeof body?.status === "string" ? body.status : undefined,
    source: typeof body?.source === "string" ? body.source : undefined,
    budgetMin: body?.budgetMin !== undefined ? num(body.budgetMin) : undefined,
    budgetMax: body?.budgetMax !== undefined ? num(body.budgetMax) : undefined,
    preferredLocation: typeof body?.preferredLocation === "string" ? body.preferredLocation : undefined,
    notes: typeof body?.notes === "string" ? body.notes : undefined,
    assignedTo: body?.assignedTo === null ? null : typeof body?.assignedTo === "string" ? body.assignedTo || null : undefined,
  });

  if (!customer) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.CUSTOMER_UPDATED,
    resource: "customer",
    resourceId: id,
    metadata: { name: `${customer.firstName} ${customer.lastName}`.trim() },
  });

  return NextResponse.json({ customer });
});

/** DELETE /api/portal/customers/:id — remove a customer. Requires customer:delete. */
export const DELETE = withPermission("customer:delete", async (_request, { params, user }) => {
  const { id } = await params;
  const existing = await getCustomerById(id);
  if (!existing) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

  await deleteCustomer(id);
  await recordAudit({
    actor: user,
    action: AUDIT_ACTIONS.CUSTOMER_DELETED,
    resource: "customer",
    resourceId: id,
    metadata: { name: `${existing.firstName} ${existing.lastName}`.trim() },
  });

  return NextResponse.json({ ok: true });
});
