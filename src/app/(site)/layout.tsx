import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AnnouncementBanner } from "@/components/layout/announcement-banner";
import { getCompanyInfo } from "@/lib/settings/company";

export const dynamic = "force-dynamic";

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Portal → Company Settings is the source of truth; constants are the fallback.
  const company = await getCompanyInfo();

  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBanner />
      <Navbar phone={company.phone} logoUrl={company.logoUrl} companyName={company.name} />
      <main className="flex-grow pt-20">{children}</main>
      <Footer company={company} />
    </div>
  );
}
