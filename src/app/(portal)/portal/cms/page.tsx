import { ModuleScaffold } from "@/components/portal/module-scaffold";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <ModuleScaffold
      title="Website CMS"
      description="Public website content: homepage, About, services and more."
      required={["cms:read"]}
      capabilities={[
        { key: "cms:read", label: "View website content" },
        { key: "cms:update", label: "Edit website content" },
        { key: "cms:homepage", label: "Edit homepage" },
        { key: "cms:about", label: "Edit About page" },
        { key: "cms:services", label: "Edit services" },
        { key: "cms:hero", label: "Manage hero sections" },
        { key: "cms:featured_properties", label: "Manage featured properties" },
        { key: "cms:contact", label: "Manage contact information" },
        { key: "cms:testimonials", label: "Manage testimonials" },
        { key: "cms:faqs", label: "Manage FAQs" },
        { key: "cms:announcements", label: "Manage announcements" },
      ]}
    />
  );
}
