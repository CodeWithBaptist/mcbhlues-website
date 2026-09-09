import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Framing is blocked in production so the site cannot be embedded in a
 * clickjacking iframe. Sandboxed preview environments (which serve the app
 * through an iframe proxy) can opt out with `ALLOW_FRAMING=true`.
 */
const blockFraming = isProduction && process.env.ALLOW_FRAMING !== "true";

/** Two years, with preload — the value required for the HSTS preload list. */
const HSTS_VALUE = "max-age=63072000; includeSubDomains; preload";

const securityHeaders = [
  // Belt to the middleware's redirect braces: once a browser has seen this it
  // will never issue a plaintext HTTP request to the domain again.
  ...(isProduction ? [{ key: "Strict-Transport-Security", value: HSTS_VALUE }] : []),
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  ...(blockFraming ? [{ key: "X-Frame-Options", value: "SAMEORIGIN" }] : []),
  //
  // Content-Security-Policy:
  //   - 'self' for scripts/styles/fonts/frames (Next.js inline RSC chunks use 'self')
  //   - Allow the images we actually optimise via next/image (see remotePatterns)
  //   - Allow the keyless Google Maps embed shown on property detail pages
  //   - Allow Cloudflare Turnstile captcha when it is configured
  //   - Allow Vercel Analytics / Speed Insights script beacons
  //
  // style-src 'unsafe-inline' is required by Next.js' runtime style injection
  // (dynamic CSS-in-JS for Tailwind/portal themes).  It is a known, accepted
  // relaxation — script-src stays locked down.
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://static.cloudflareinsights.com https://cdn.vercel-insights.com https://va.vercel-scripts.com https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:;",
      "font-src 'self' data:",
      "connect-src 'self' https: wss:;",
      "frame-src 'self' https://maps.google.com https://www.google.com https://challenges.cloudflare.com",
      "frame-ancestors " + (blockFraming ? "'self'" : "'none'"),
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.e2b.app"],
  // PGlite ships a WASM build of PostgreSQL and must stay outside the bundler.
  // nodemailer opens raw TCP sockets and should not be bundled either.
  serverExternalPackages: ["@electric-sql/pglite", "nodemailer", "sharp"],

  // Trim the client bundle: only the icons actually imported get shipped.
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },

  poweredByHeader: false,
  compress: true,

  images: {
    // Modern formats first — AVIF/WebP typically cut payload 40-70% versus JPEG.
    formats: ["image/avif", "image/webp"],
    // Only hosts we actually render are allowed through the optimizer; anything
    // else falls back to a plain <img> (see components/ui/smart-image.tsx).
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
    ],
    deviceSizes: [360, 480, 640, 750, 828, 1080, 1200, 1600, 1920],
    imageSizes: [64, 96, 128, 200, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/og-image.jpg",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, s-maxage=604800" },
        ],
      },
    ];
  },
};

export default nextConfig;
