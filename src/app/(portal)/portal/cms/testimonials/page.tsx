import { pageAccess } from "@/lib/rbac/page-guard";
import { listTestimonials } from "@/lib/cms/cms-service";
import { AccessDenied } from "@/components/portal/access-denied";
import { PageHeader } from "@/components/portal/ui";
import { TestimonialsManager } from "@/components/portal/testimonials-manager";

export const dynamic = "force-dynamic";

export default async function TestimonialsPage() {
  const access = await pageAccess(["cms:testimonials", "cms:read"]);
  if (!access.allowed) return <AccessDenied required={access.required} />;

  const rows = await listTestimonials();
  const testimonials = rows.map((row) => ({
    id: row.id,
    name: row.name,
    role: row.role,
    quote: row.quote,
    avatarUrl: row.avatarUrl,
    rating: row.rating,
    isPublished: row.isPublished,
    sortOrder: row.sortOrder,
  }));

  return (
    <div>
      <PageHeader
        title="Testimonials"
        description="Client testimonials — published entries appear on the public homepage."
      />
      <TestimonialsManager
        initialTestimonials={testimonials}
        canManage={access.user.permissions.includes("cms:testimonials")}
      />
    </div>
  );
}
