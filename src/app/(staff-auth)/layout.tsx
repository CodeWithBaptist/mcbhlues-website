import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { getCompanyInfo } from "@/lib/settings/company";
import type { Metadata } from "next";
import { PortalThemeToggle } from "@/components/theme/portal-theme-toggle";

export const metadata: Metadata = {
  title: {
    default: "Staff Portal",
    template: "%s | Staff Portal",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default async function StaffAuthLayout({ children }: { children: React.ReactNode }) {
  const company = await getCompanyInfo();
  return (
    <div className="staff-auth flex min-h-screen flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Logo logoUrl={company.logoUrl} name={company.name} />
          <div className="flex items-center gap-4">
            <Link href="/" className="hidden text-sm font-medium text-gray-600 transition-colors hover:text-primary sm:block">Back to website</Link>
            <PortalThemeToggle />
          </div>
        </div>
      </header>
      <main id="main-content" className="flex flex-1 items-center justify-center bg-gray-50 px-4 py-12 sm:py-16">{children}</main>
      <footer className="border-t border-gray-200 px-4 py-5 text-center text-xs text-gray-500">MCBHLUES Enterprises · Staff Portal</footer>
    </div>
  );
}
