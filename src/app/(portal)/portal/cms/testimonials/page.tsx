import { ModuleScaffold } from "@/components/portal/module-scaffold";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <ModuleScaffold
      title="Testimonials"
      description="Customer testimonials shown on the public website."
      required={["cms:testimonials"]}
      capabilities={[
        { key: "cms:testimonials", label: "Manage testimonials" },
        { key: "media:upload", label: "Upload images" },
      ]}
    />
  );
}
