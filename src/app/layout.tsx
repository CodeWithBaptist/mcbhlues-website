import type { Metadata, Viewport } from "next";
import Font from "next/font/local";
import "./globals.css";
import { SITE_CONFIG, SITE_URL } from "@/constants";
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
  preload: true,
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
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
  preload: true,
  fallback: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
});

const TITLE_DEFAULT = `${SITE_CONFIG.name} — ${SITE_CONFIG.tagline}`;

export const metadata: Metadata = {
  // Makes every relative URL below (and in child pages) resolve to an absolute
  // one, which Open Graph and Twitter both require.
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE_DEFAULT,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  applicationName: SITE_CONFIG.name,
  keywords: [
    "real estate Lagos",
    "property for sale Lagos",
    "property for rent Lagos",
    "real estate consulting Nigeria",
    "property development Lagos",
    "facility management Lagos",
    "Victoria Island property",
    "MCBHLUES Enterprises",
  ],
  authors: [{ name: SITE_CONFIG.name, url: SITE_URL }],
  creator: SITE_CONFIG.name,
  publisher: SITE_CONFIG.name,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: SITE_CONFIG.name,
    locale: "en_NG",
    url: SITE_URL,
    title: TITLE_DEFAULT,
    description: SITE_CONFIG.description,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: `${SITE_CONFIG.name} — real estate consulting, development and facility management in Lagos, Nigeria`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE_DEFAULT,
    description: SITE_CONFIG.description,
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "real estate",
  formatDetection: { telephone: true, address: true, email: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Never block pinch-zoom — capping it is a WCAG 1.4.4 failure.
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1220" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-NG" suppressHydrationWarning className={`${inter.variable} ${poppins.variable}`}>
      <head>
        {/* Warm up the connections the page will need for imagery. */}
        <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        {/* Apply the saved public theme before the first paint to avoid a flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try { var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches; var publicTheme = localStorage.getItem("mcbhlues-public-theme"); var portalTheme = localStorage.getItem("mcbhlues-portal-theme"); if (publicTheme === "dark" || (!publicTheme && prefersDark)) document.documentElement.classList.add("public-dark"); if (portalTheme === "dark" || (!portalTheme && prefersDark)) document.documentElement.classList.add("portal-dark"); } catch (error) {}`,
          }}
        />
      </head>
      <body className="antialiased">
        {/* First tab stop on every page — WCAG 2.4.1 (Bypass Blocks). */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-white focus:shadow-lg"
        >
          Skip to main content
        </a>
        <ThemeProvider>
          <StaffThemeProvider>{children}</StaffThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
