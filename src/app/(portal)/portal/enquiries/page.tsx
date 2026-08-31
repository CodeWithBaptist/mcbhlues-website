import { ModuleScaffold } from "@/components/portal/module-scaffold";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <ModuleScaffold
      title="Enquiries"
      description="Incoming enquiries, assignment and follow-up."
      required={["enquiry:read", "enquiry:property_read", "enquiry:assigned_read"]}
      capabilities={[
        { key: "enquiry:read", label: "View all enquiries" },
        { key: "enquiry:property_read", label: "View property enquiries" },
        { key: "enquiry:assigned_read", label: "View assigned enquiries" },
        { key: "enquiry:create", label: "Create enquiries" },
        { key: "enquiry:update", label: "Update enquiries" },
        { key: "enquiry:delete", label: "Delete enquiry records" },
        { key: "enquiry:assign", label: "Assign or forward enquiries" },
        { key: "enquiry:respond", label: "Respond to enquiries" },
        { key: "enquiry:status_update", label: "Update enquiry status" },
        { key: "enquiry:notes", label: "Add internal notes" },
      ]}
    />
  );
}
