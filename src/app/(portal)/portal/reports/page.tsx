import { ModuleScaffold } from "@/components/portal/module-scaffold";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <ModuleScaffold
      title="Reports"
      description="Operational and performance reporting."
      required={["report:read"]}
      capabilities={[
        { key: "report:read", label: "View reports" },
        { key: "activity:read", label: "View staff activity logs" },
        { key: "audit:read", label: "View audit logs" },
        { key: "log:read", label: "View system logs" },
      ]}
    />
  );
}
