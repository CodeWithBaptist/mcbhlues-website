"use client";

import { History } from "lucide-react";
import { Card, EmptyState } from "./ui";

export interface ActivityItem {
  id: string;
  action: string;
  description: string;
  actor: string;
  createdAt: string;
}

function relative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

/** Timeline of what has been happening in the portal recently. */
export function ActivityFeed({ items, className }: { items: ActivityItem[]; className?: string }) {
  return (
    <Card
      className={className}
      title="Recent activity"
      description="What has been happening across the portal"
      actions={
        items.length > 0 ? (
          <span className="text-xs text-gray-500">{items.length} events</span>
        ) : undefined
      }
    >
      {items.length === 0 ? (
        <EmptyState
          icon={<History className="h-6 w-6" />}
          title="Nothing yet"
          description="Actions you and your colleagues take will appear here as a timeline. New activity shows up in real time."
        />
      ) : (
        <ol className="divide-y divide-gray-100">
          {items.map((item) => (
            <li key={item.id} className="py-4 first:pt-0 last:pb-0">
              <p className="text-sm font-medium leading-relaxed text-dark">{item.description || item.action.replaceAll(".", " ")}</p>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs leading-relaxed text-gray-500">
                <time dateTime={item.createdAt} title={item.createdAt}>{relative(item.createdAt)}</time>
                <span aria-hidden="true">·</span><span className="break-all">{item.actor}</span>
                <code className="text-xs text-gray-500">{item.action}</code>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
