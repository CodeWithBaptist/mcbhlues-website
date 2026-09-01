import { pageAccess } from "@/lib/rbac/page-guard";
import { loadBookingsForUser } from "@/lib/bookings/booking-service";
import { loadCustomersForUser, listPropertyOptions } from "@/lib/customers/customer-service";
import { listStaff } from "@/lib/rbac/staff-service";
import { hasPermission } from "@/lib/rbac/can";
import { AccessDenied } from "@/components/portal/access-denied";
import { PageHeader } from "@/components/portal/ui";
import { BookingsManager } from "@/components/portal/bookings-manager";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const access = await pageAccess(["booking:read", "booking:property_read", "booking:assigned_read"]);
  if (!access.allowed) return <AccessDenied required={access.required} />;

  const user = access.user;
  const canAssign = user.permissions.includes("booking:assign");

  // Customer options are only needed for linking; load when the caller may see customers.
  const canSeeCustomers = hasPermission(user.permissions, ["customer:read", "customer:assigned_read"]);

  const [bookingList, staffRows, propertyOptions, customerRows] = await Promise.all([
    loadBookingsForUser(user),
    canAssign ? listStaff() : Promise.resolve([]),
    listPropertyOptions(),
    canSeeCustomers ? loadCustomersForUser(user) : Promise.resolve([]),
  ]);

  const staff = staffRows.map((row) => ({
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
  }));

  const customers = customerRows.map((row) => ({
    id: row.id,
    name: `${row.firstName} ${row.lastName}`.trim(),
  }));

  return (
    <div>
      <PageHeader
        title="Bookings"
        description="Viewings, consultations and inspections — confirmation, rejection and rescheduling."
      />
      <BookingsManager
        initialBookings={bookingList}
        staff={staff}
        propertyOptions={propertyOptions}
        customers={customers}
        canAssign={canAssign}
        permissions={user.permissions}
      />
    </div>
  );
}
