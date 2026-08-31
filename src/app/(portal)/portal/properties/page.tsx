import { ModuleScaffold } from "@/components/portal/module-scaffold";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <ModuleScaffold
      title="Properties"
      description="Property listings, media, pricing and availability."
      required={["property:read", "property:assigned_read", "property:read_available"]}
      capabilities={[
        { key: "property:read", label: "View all properties" },
        { key: "property:read_available", label: "View available properties" },
        { key: "property:assigned_read", label: "View assigned properties" },
        { key: "property:create", label: "Create properties" },
        { key: "property:update", label: "Edit properties" },
        { key: "property:delete", label: "Delete properties" },
        { key: "property:publish", label: "Publish properties" },
        { key: "property:unpublish", label: "Unpublish properties" },
        { key: "property:status_update", label: "Update property status" },
        { key: "property:price_update", label: "Set property prices" },
        { key: "property:availability_update", label: "Set availability" },
        { key: "property:mark_sold", label: "Mark as sold" },
        { key: "property:mark_rented", label: "Mark as rented" },
        { key: "property:image_manage", label: "Manage property images" },
        { key: "property:amenity_manage", label: "Manage amenities" },
        { key: "property:feature_manage", label: "Manage features" },
        { key: "property:location_manage", label: "Set location on Google Maps" },
      ]}
    />
  );
}
