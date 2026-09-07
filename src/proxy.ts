import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "mcbhlues_staff_session";

const CANONICAL_HOST = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://mcbhlues.com").host;
  } catch {
    return "mcbhlues.com";
  }
})();

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "0.0.0.0"]);

/** Portal routes that anonymous visitors may reach (login + invite flow). */
const PORTAL_PUBLIC = /^\/portal\/(login|invite)(\/|$)/;
const PORTAL_PROTECTED = /^\/portal(\/|$)/;

function isLocal(hostname: string) {
  return LOCAL_HOSTS.has(hostname) || hostname.endsWith(".local");
}

/**
 * Request proxy (Next.js 16's replacement for `middleware.ts`). Three jobs, in
 * order:
 *
 *  1. **Force HTTPS.** Any plaintext request is 308-redirected to the https://
 *     equivalent. Behind Vercel/any reverse proxy the original scheme arrives
 *     in `x-forwarded-proto`, so that is what we inspect. `Strict-Transport-
 *     Security` (see next.config.ts) then stops the browser repeating the
 *     mistake. Skipped on localhost and when `DISABLE_HTTPS_REDIRECT=true`.
 *  2. **Canonicalise the host.** `www.` is folded onto the apex domain so a
 *     page is never indexed twice.
 *  3. **Gate the Staff Portal.** Bounces obviously-anonymous traffic before it
 *     reaches the server components. A convenience only — cookie presence
 *     proves nothing, so every page and API route re-verifies the session and
 *     its permissions against the database.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hostHeader = request.headers.get("host") ?? request.nextUrl.host;
  const hostname = hostHeader.split(":")[0].toLowerCase();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0].trim();

  const redirectsEnabled =
    // Only in production behind a real proxy. In development the host is a
    // sandbox/preview origin and a scheme redirect can loop.
    process.env.NODE_ENV === "production" &&
    process.env.DISABLE_HTTPS_REDIRECT !== "true" &&
    !isLocal(hostname);

  if (redirectsEnabled) {
    // 1. http:// → https://
    //    Only act on an explicit `x-forwarded-proto: http`. Inferring the
    //    scheme from the request URL would loop forever behind a TLS-
    //    terminating proxy that doesn't send the header.
    if (forwardedProto === "http") {
      return NextResponse.redirect(`https://${hostHeader}${pathname}${search}`, 308);
    }

    // 2. www.example.com → example.com (only for our own canonical domain).
    if (hostname === `www.${CANONICAL_HOST}`) {
      return NextResponse.redirect(`https://${CANONICAL_HOST}${pathname}${search}`, 308);
    }
  }

  // 3. Staff Portal gate.
  if (PORTAL_PROTECTED.test(pathname) && !PORTAL_PUBLIC.test(pathname)) {
    const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
    if (!hasSessionCookie) {
      const loginUrl = new URL("/portal/login", request.url);
      loginUrl.searchParams.set("next", `${pathname}${search}`);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Everything except Next.js internals and static assets that are served
     * straight off the CDN edge (they are already https-only there).
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.png|robots.txt|sitemap.xml|og-image.jpg).*)",
  ],
};
