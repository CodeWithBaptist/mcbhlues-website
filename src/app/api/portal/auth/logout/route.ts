import { NextResponse, type NextRequest } from "next/server";
import { destroyCurrentSession, getCurrentUser } from "@/lib/auth/session";
import { AUDIT_ACTIONS, recordAudit } from "@/lib/rbac/audit";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";

const LOGOUT_BURST = { limit: 30, windowMs: 5 * 60 * 1000 };

/**
 * POST /api/portal/auth/logout — revoke the caller's session cookie.
 *
 * Logout is idempotent and safe to call without a session (e.g. the
 * client-side idle-timeout dialog), so authentication is optional here.
 * We still enforce same-origin (in api-guard pattern) to prevent a
 * cross-site page from forging sign-outs, and apply a small burst limit.
 */
export async function POST(request: NextRequest) {
  // Same-origin enforcement for mutating request — matches api-guard behaviour.
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const hostHeader = request.headers.get("host") ?? request.nextUrl.host;
  const host = hostHeader.split(":")[0].toLowerCase();
  const isLocal =
    host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host.endsWith(".local");
  const source = origin || referer;
  if (process.env.NODE_ENV === "production" && !isLocal && source) {
    try {
      const url = new URL(source);
      if (url.hostname.toLowerCase() !== host) {
        return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
    }
  }

  const ip = clientIp(request);
  rateLimit(`logout:${ip}`, LOGOUT_BURST);

  const user = await getCurrentUser();
  if (user) {
    await recordAudit({
      actor: user,
      action: AUDIT_ACTIONS.LOGOUT,
      resource: "user",
      resourceId: user.id,
    });
  }
  await destroyCurrentSession();
  return NextResponse.json({ ok: true });
}
