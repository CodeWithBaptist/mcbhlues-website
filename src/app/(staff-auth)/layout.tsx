import type { Metadata } from "next";

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

export default function StaffAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary-dark via-primary to-primary-light px-4 py-12">
      {children}
    </div>
  );
}
