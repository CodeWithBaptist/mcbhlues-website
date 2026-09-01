import { Metadata } from "next";
import { pageAccess } from "@/lib/rbac/page-guard";
import { AccessDenied } from "@/components/portal/access-denied";
import { Card, PageHeader } from "@/components/portal/ui";
import { ChangePasswordForm } from "@/components/portal/change-password-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Change Password",
};

export default async function ChangePasswordPage() {
  // Available to any authenticated staff member — no specific permission needed.
  const access = await pageAccess([]);
  if (!access.allowed) return <AccessDenied required={access.required} />;

  return (
    <div className="max-w-xl">
      <PageHeader
        title="Change your password"
        description="Set a new password for your own account. You'll stay signed in — other active sessions are revoked."
      />
      <Card title="Update password" description="Enter your current password to confirm your identity.">
        <ChangePasswordForm />
      </Card>
    </div>
  );
}
