"use client";

import { History } from "lucide-react";
import { cn } from "@/lib/utils";
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

const TONE_BY_PREFIX: Record<string, string> = {
  auth: "bg-sky-500",
  property: "bg-emerald-500",
  enquiry: "bg-amber-500",
  booking: "bg-violet-500",
  staff: "bg-rose-500",
  settings: "bg-slate-500",
};

/** Timeline of what has been happening in the portal recently. */
export function ActivityFeed({ items, className }: { items: ActivityItem[]; className?: string }) {
  return (
    <Card
      className={className}
      title="Recent activity"
      description="What has been happening across the portal"
    >
      {items.length === 0 ? (
        <EmptyState
          title="Nothing yet"
          description="Actions you and your colleagues take will appear here as a timeline."
        />
      ) : (
        <ol className="portal-stagger relative space-y-4 border-l border-gray-100 pl-5">
          {items.map((item) => {
            const tone = TONE_BY_PREFIX[item.action.split(".")[0]] ?? "bg-primary";
            return (
              <li key={item.id} className="relative">
                <span
                  className={cn(
                    "absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-white",
                    tone
                  )}
                />
                <p className="text-sm font-medium text-dark">
                  {item.description || item.action.replaceAll(".", " ")}
                </p>
                <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                  <History className="h-3 w-3" />
                  {relative(item.createdAt)} · {item.actor} ·{" "}
                  <code className="rounded bg-gray-100 px-1 py-0.5 text-[10px]">{item.action}</code>
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
