import { pageAccess } from "@/lib/rbac/page-guard";
import { listNotificationsForUser, unreadCountForUser } from "@/lib/notifications/notification-service";
import { listStaff } from "@/lib/rbac/staff-service";
import { AccessDenied } from "@/components/portal/access-denied";
import { PageHeader } from "@/components/portal/ui";
import { NotificationsManager } from "@/components/portal/notifications-manager";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const access = await pageAccess("notification:read");
  if (!access.allowed) return <AccessDenied required={access.required} />;

  const user = access.user;
  const canManage = user.permissions.includes("notification:manage");

  const [feed, unread, staffRows] = await Promise.all([
    listNotificationsForUser(user.id),
    unreadCountForUser(user.id),
    canManage ? listStaff() : Promise.resolve([]),
  ]);

  const staff = staffRows.map((row) => ({
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
  }));

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Workflow events and announcements addressed to you or broadcast to the team."
      />
      <NotificationsManager
        initialNotifications={feed}
        canManage={canManage}
        staff={staff}
      />
      <p className="mt-3 text-xs text-gray-400">{unread} unread right now.</p>
    </div>
  );
}
