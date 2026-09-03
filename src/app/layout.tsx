import type { Metadata } from "next";
import Font from "next/font/local";
import "./globals.css";
import { SITE_CONFIG } from "@/constants";
import { StaffThemeProvider } from "@/components/theme/staff-theme-provider";
import { ThemeProvider } from "@/components/theme/theme-provider";

// Fonts are self-hosted (src/fonts) so builds don't need to reach
// fonts.googleapis.com — `next/font/google` fetches at build time and
// fails in offline/air-gapped environments.
// Inter and Poppins are OFL-licensed; see src/fonts/LICENSE.md.
const inter = Font({
  src: [
    { path: "../fonts/inter-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/inter-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../fonts/inter-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../fonts/inter-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../fonts/inter-latin-800-normal.woff2", weight: "800", style: "normal" },
    { path: "../fonts/inter-latin-900-normal.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Font({
  src: [
    { path: "../fonts/poppins-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/poppins-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../fonts/poppins-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../fonts/poppins-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../fonts/poppins-latin-800-normal.woff2", weight: "800", style: "normal" },
    { path: "../fonts/poppins-latin-900-normal.woff2", weight: "900", style: "normal" },
  ],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: SITE_CONFIG.name,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${poppins.variable}`}>
      <head>
        {/* Apply the saved public theme before the first paint to avoid a flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try { var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches; var publicTheme = localStorage.getItem("mcbhlues-public-theme"); var portalTheme = localStorage.getItem("mcbhlues-portal-theme"); if (publicTheme === "dark" || (!publicTheme && prefersDark)) document.documentElement.classList.add("public-dark"); if (portalTheme === "dark" || (!portalTheme && prefersDark)) document.documentElement.classList.add("portal-dark"); } catch (error) {}`,
          }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <StaffThemeProvider>{children}</StaffThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
