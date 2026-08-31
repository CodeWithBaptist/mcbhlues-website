import { ModuleScaffold } from "@/components/portal/module-scaffold";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <ModuleScaffold
      title="FAQs"
      description="Frequently asked questions shown on the public website."
      required={["cms:faqs"]}
      capabilities={[
        { key: "cms:faqs", label: "Manage FAQs" },
        { key: "cms:update", label: "Edit website content" },
      ]}
    />
  );
}
