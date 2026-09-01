import { getDb } from "@/db";
import { pageAccess } from "@/lib/rbac/page-guard";
import { loadPropertiesForUser } from "@/lib/properties/property-service";
import { listStaff } from "@/lib/rbac/staff-service";
import { AccessDenied } from "@/components/portal/access-denied";
import { PageHeader } from "@/components/portal/ui";
import { PropertiesManager } from "@/components/portal/properties-manager";

export const dynamic = "force-dynamic";

export default async function PropertiesPage() {
  const access = await pageAccess([
    "property:read",
    "property:read_available",
    "property:assigned_read",
  ]);
  if (!access.allowed) return <AccessDenied required={access.required} />;

  const user = access.user;
  const canAssign = user.permissions.includes("property:assign");

  const db = await getDb();
  const [properties, staffRows] = await Promise.all([
    loadPropertiesForUser(user),
    canAssign ? listStaff() : Promise.resolve([]),
  ]);

  const staff = staffRows.map((row) => ({
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    roles: row.roles.map((role) => role.name),
  }));

  return (
    <div>
      <PageHeader
        title="Properties"
        description="Full listing control — images, amenities, features, pricing, status and Google Maps locations."
      />
      <PropertiesManager
        initialProperties={properties}
        staff={staff}
        canAssign={canAssign}
        permissions={user.permissions}
      />
    </div>
  );
}
