import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AnnouncementBanner } from "@/components/layout/announcement-banner";

export const dynamic = "force-dynamic";

export default async function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBanner />
      <Navbar />
      <main className="flex-grow pt-20">{children}</main>
      <Footer />
    </div>
  );
}
