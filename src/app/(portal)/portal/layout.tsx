import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { getNavigationForUser } from "@/lib/rbac/navigation";
import { PermissionProvider } from "@/components/portal/permission-provider";
import { PortalSidebar } from "@/components/portal/portal-sidebar";
import { PortalTopbar } from "@/components/portal/portal-topbar";

export const metadata: Metadata = {
  title: "Staff Portal",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  // Server-side authentication gate for every page in the portal.
  const user = await getCurrentUser();
  if (!user) redirect("/portal/login");

  const navigation = await getNavigationForUser(user);

  return (
    <PermissionProvider
      user={{
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        roles: user.roles.map((role) => ({ key: role.key, name: role.name, level: role.level })),
        level: user.level,
        permissions: user.permissions,
      }}
    >
      <div className="staff-portal flex min-h-screen bg-[radial-gradient(1200px_600px_at_10%_-10%,rgba(37,99,235,0.08),transparent),linear-gradient(to_bottom,#f8fafc,#f1f5f9)]">
        <PortalSidebar navigation={navigation} />
        <div className="flex min-w-0 flex-1 flex-col">
          <PortalTopbar />
          <main className="portal-enter flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </PermissionProvider>
  );
}
