import { pageAccess } from "@/lib/rbac/page-guard";
import { loadCustomersForUser, listPropertyOptions } from "@/lib/customers/customer-service";
import { listStaff } from "@/lib/rbac/staff-service";
import { AccessDenied } from "@/components/portal/access-denied";
import { PageHeader } from "@/components/portal/ui";
import { CustomersManager } from "@/components/portal/customers-manager";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const access = await pageAccess(["customer:read", "customer:assigned_read"]);
  if (!access.allowed) return <AccessDenied required={access.required} />;

  const user = access.user;
  const [customerList, staffRows, propertyOptions] = await Promise.all([
    loadCustomersForUser(user),
    listStaff(),
    listPropertyOptions(),
  ]);

  const staff = staffRows.map((row) => ({
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
  }));

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Customer records, internal notes, saved properties and their enquiry/booking history."
      />
      <CustomersManager
        initialCustomers={customerList}
        staff={staff}
        propertyOptions={propertyOptions}
        permissions={user.permissions}
      />
    </div>
  );
}
