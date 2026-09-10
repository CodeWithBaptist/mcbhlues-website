import Link from "next/link";
import { Building2, CalendarClock, MessageSquare } from "lucide-react";
import { Card, StatusPill } from "@/components/portal/ui";

export type LatestEnquiryItem = {
  id: string;
  reference: string;
  /** Subject line, falling back to the sender's name when blank. */
  subject: string;
  /** general | property | viewing — drives the leading icon. */
  type: string;
  status: string;
  propertyName: string | null;
  /** ISO date — formatted deterministically (UTC) on the server. */
  createdAt: string;
};

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  property: Building2,
  viewing: CalendarClock,
};

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

/**
 * The reference mockup's "Maintenance Requests" card, mapped onto this
 * portal's nearest workflow: the newest inbound enquiries, each with a soft
 * icon chip, its human reference and the status pill used everywhere else.
 */
export function LatestEnquiries({
  items,
  href = "/portal/enquiries",
  className,
}: {
  items: LatestEnquiryItem[];
  href?: string;
  className?: string;
}) {
  return (
    <Card
      className={className}
      title="Latest enquiries"
      description="Newest messages waiting in the inbox"
      actions={
        <Link
          href={href}
          className="text-sm font-medium text-primary underline-offset-4 transition-colors hover:text-primary-dark hover:underline"
        >
          View all
        </Link>
      }
    >
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-500">
          No enquiries yet — new website messages land here.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {items.map((item) => {
            const Icon = TYPE_ICONS[item.type] ?? MessageSquare;
            return (
              <li key={item.id}>
                <Link
                  href={href}
                  className="group -mx-2 flex items-center gap-3 rounded-md px-2 py-3 transition-colors duration-200 hover:bg-gray-50"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary-dark"
                    aria-hidden="true"
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-dark transition-colors group-hover:text-primary">
                      {item.subject}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-gray-500">
                      {item.reference}
                      {item.propertyName ? ` · ${item.propertyName}` : ""} ·{" "}
                      {dateFormatter.format(new Date(item.createdAt))}
                    </span>
                  </span>
                  <StatusPill status={item.status} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
