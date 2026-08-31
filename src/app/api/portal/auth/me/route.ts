import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";

/** Returns the caller's identity, roles and effective permissions. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required.", code: "UNAUTHENTICATED" }, { status: 401 });
  }
  return NextResponse.json({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    status: user.status,
    roles: user.roles,
    level: user.level,
    permissions: user.permissions,
  });
}
