import { ModuleScaffold } from "@/components/portal/module-scaffold";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <ModuleScaffold
      title="Notifications"
      description="System and workflow notifications."
      required={["notification:read"]}
      capabilities={[
        { key: "notification:read", label: "View notifications" },
        { key: "notification:manage", label: "Manage notifications" },
      ]}
    />
  );
}
