import { ModuleScaffold } from "@/components/portal/module-scaffold";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <ModuleScaffold
      title="Media Library"
      description="Images, documents and brand assets."
      required={["media:read"]}
      capabilities={[
        { key: "media:read", label: "Browse media" },
        { key: "media:upload", label: "Upload media" },
        { key: "media:delete", label: "Delete media" },
        { key: "media:documents", label: "Manage documents" },
        { key: "media:logo", label: "Manage the company logo" },
        { key: "property:image_manage", label: "Manage property images" },
      ]}
    />
  );
}
