import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "mcbhlues_staff_session";

/**
 * Edge-level gate: bounces obviously-anonymous traffic away from the Staff
 * Portal before it reaches the server components. It is a convenience only —
 * cookie presence proves nothing, so every page and API route re-verifies the
 * session and its permissions against the database.
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSessionCookie = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (!hasSessionCookie) {
    const loginUrl = new URL("/portal/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/portal", "/portal/((?!login|invite).*)"],
};
