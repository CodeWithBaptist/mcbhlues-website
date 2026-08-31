import { ModuleScaffold } from "@/components/portal/module-scaffold";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <ModuleScaffold
      title="Customers"
      description="Customer records, enquiries, bookings and saved properties."
      required={["customer:read", "customer:assigned_read"]}
      capabilities={[
        { key: "customer:read", label: "View customers" },
        { key: "customer:assigned_read", label: "View assigned customers" },
        { key: "customer:create", label: "Add customers" },
        { key: "customer:update", label: "Edit customer information" },
        { key: "customer:delete", label: "Delete customers" },
        { key: "customer:notes", label: "Add internal notes" },
        { key: "customer:enquiries_read", label: "View customer enquiries" },
        { key: "customer:bookings_read", label: "View customer bookings" },
        { key: "customer:saved_read", label: "View saved properties" },
      ]}
    />
  );
}
