import { ModuleScaffold } from "@/components/portal/module-scaffold";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <ModuleScaffold
      title="Announcements"
      description="Site-wide announcements and banners."
      required={["cms:announcements"]}
      capabilities={[
        { key: "cms:announcements", label: "Manage announcements" },
        { key: "cms:hero", label: "Manage hero banners" },
      ]}
    />
  );
}
