import { NextResponse } from "next/server";
import { withPermission } from "@/lib/rbac/api-guard";
import { listSubscribers, summariseSubscribers } from "@/lib/subscribers/subscriber-service";

/**
 * GET /api/portal/subscribers — the newsletter list, newest first, plus the
 * counts the screen shows above the table. Requires `subscriber:read`.
 *
 * The list is returned whole and filtered in the browser (see
 * `SubscribersManager`), which is what makes search instant on a list of a few
 * thousand addresses. The public sign-up form writes to the same table, so
 * every address that joined from the homepage shows up here.
 */
export const GET = withPermission("subscriber:read", async () => {
  const subscribers = await listSubscribers();
  return NextResponse.json({
    subscribers,
    summary: summariseSubscribers(subscribers),
  });
});
