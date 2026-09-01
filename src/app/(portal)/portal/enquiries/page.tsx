import { pageAccess } from "@/lib/rbac/page-guard";
import { loadEnquiriesForUser } from "@/lib/enquiries/enquiry-service";
import { listPropertyOptions } from "@/lib/customers/customer-service";
import { listStaff } from "@/lib/rbac/staff-service";
import { AccessDenied } from "@/components/portal/access-denied";
import { PageHeader } from "@/components/portal/ui";
import { EnquiriesManager } from "@/components/portal/enquiries-manager";

export const dynamic = "force-dynamic";

export default async function EnquiriesPage() {
  const access = await pageAccess(["enquiry:read", "enquiry:property_read", "enquiry:assigned_read"]);
  if (!access.allowed) return <AccessDenied required={access.required} />;

  const user = access.user;
  const canAssign = user.permissions.includes("enquiry:assign");

  const [enquiryList, staffRows, propertyOptions] = await Promise.all([
    loadEnquiriesForUser(user),
    canAssign ? listStaff() : Promise.resolve([]),
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
        title="Enquiries"
        description="Incoming website and walk-in enquiries — assignment, responses and internal notes."
      />
      <EnquiriesManager
        initialEnquiries={enquiryList}
        staff={staff}
        propertyOptions={propertyOptions}
        canAssign={canAssign}
        permissions={user.permissions}
        currentUserId={user.id}
      />
    </div>
  );
}
