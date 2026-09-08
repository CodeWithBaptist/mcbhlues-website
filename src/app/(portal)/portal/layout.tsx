import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/session";
import { getNavigationForUser } from "@/lib/rbac/navigation";
import { PermissionProvider } from "@/components/portal/permission-provider";
import { PortalSidebar } from "@/components/portal/portal-sidebar";
import { PortalTopbar } from "@/components/portal/portal-topbar";
import { PortalBackToTop } from "@/components/portal/portal-back-to-top";
import { SecurityTimeout } from "@/components/portal/security-timeout";

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
      <div className="staff-portal flex min-h-screen bg-[radial-gradient(1100px_560px_at_8%_-8%,rgba(37,99,235,0.08),transparent),radial-gradient(900px_520px_at_92%_0%,rgba(96,165,250,0.06),transparent),linear-gradient(to_bottom,#f8fafc,#f1f5f9)]">
        <a href="#main-content" className="sr-only fixed left-4 top-4 z-[120] rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg focus:not-sr-only focus:outline-none focus:ring-4 focus:ring-primary/30">
          Skip to main content
        </a>
        <PortalSidebar navigation={navigation} />
        <div className="flex min-w-0 flex-1 flex-col">
          <PortalTopbar />
          <main id="main-content" className="portal-enter flex-1 px-4 py-6 lg:px-6 lg:py-7 xl:px-8 xl:py-8">
            {children}
          </main>
          <PortalBackToTop />
        </div>
        <SecurityTimeout />
      </div>
    </PermissionProvider>
  );
}
