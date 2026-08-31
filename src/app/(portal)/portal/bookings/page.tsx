import { ModuleScaffold } from "@/components/portal/module-scaffold";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <ModuleScaffold
      title="Bookings"
      description="Viewings and bookings, confirmations and scheduling."
      required={["booking:read", "booking:property_read", "booking:assigned_read"]}
      capabilities={[
        { key: "booking:read", label: "View all bookings" },
        { key: "booking:property_read", label: "View property bookings" },
        { key: "booking:assigned_read", label: "View assigned bookings" },
        { key: "booking:create", label: "Create bookings" },
        { key: "booking:update", label: "Update bookings" },
        { key: "booking:delete", label: "Delete bookings" },
        { key: "booking:approve", label: "Confirm bookings" },
        { key: "booking:reject", label: "Reject bookings" },
        { key: "booking:reschedule", label: "Reschedule bookings" },
        { key: "booking:assign", label: "Assign bookings to staff" },
        { key: "booking:status_update", label: "Update booking status" },
      ]}
    />
  );
}
