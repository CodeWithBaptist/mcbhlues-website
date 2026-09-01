import { pageAccess } from "@/lib/rbac/page-guard";
import { listFaqs } from "@/lib/cms/cms-service";
import { AccessDenied } from "@/components/portal/access-denied";
import { PageHeader } from "@/components/portal/ui";
import { FaqsManager } from "@/components/portal/faqs-manager";

export const dynamic = "force-dynamic";

export default async function FaqsPage() {
  const access = await pageAccess(["cms:faqs", "cms:read"]);
  if (!access.allowed) return <AccessDenied required={access.required} />;

  const rows = await listFaqs();
  const faqs = rows.map((row) => ({
    id: row.id,
    question: row.question,
    answer: row.answer,
    category: row.category,
    isPublished: row.isPublished,
    sortOrder: row.sortOrder,
  }));

  return (
    <div>
      <PageHeader
        title="FAQs"
        description="Frequently asked questions — published entries appear on the public website."
      />
      <FaqsManager initialFaqs={faqs} canManage={access.user.permissions.includes("cms:faqs")} />
    </div>
  );
}
