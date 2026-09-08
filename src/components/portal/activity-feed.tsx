"use client";

import { History, Clock3 } from "lucide-react";
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
  booking: "bg-sky-500",
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
      actions={
        items.length > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-900 px-2 py-1 text-[11px] font-semibold text-white">
            <Clock3 className="h-3 w-3" />
            {items.length} events
          </span>
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
        <ol className="portal-stagger relative space-y-0">
          {/* vertical line */}
          <div className="pointer-events-none absolute bottom-2 left-[11px] top-2 w-px bg-gradient-to-b from-gray-200 via-gray-200 to-transparent" aria-hidden />
          {items.map((item) => {
            const tone = TONE_BY_PREFIX[item.action.split(".")[0]] ?? "bg-primary";
            return (
              <li
                key={item.id}
                className="group relative flex gap-3 rounded-xl px-2 py-3 transition-colors duration-200 hover:bg-gray-50"
              >
                <span
                  className={cn(
                    "relative mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white shadow-sm ring-4 ring-white transition-transform duration-300 ease-soft group-hover:scale-110",
                    tone
                  )}
                >
                  <span className="h-2 w-2 rounded-full bg-white" />
                  <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-snug text-dark">
                    {item.description || item.action.replaceAll(".", " ")}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-1.5 py-0.5 ring-1 ring-gray-200">
                      <History className="h-3 w-3 text-gray-400" />
                      {relative(item.createdAt)}
                    </span>
                    <span className="text-gray-300">•</span>
                    <span className="truncate font-medium text-gray-700">{item.actor}</span>
                    <code className="hidden rounded-md bg-gray-900 px-1.5 py-0.5 text-[10px] font-medium text-white sm:inline-flex">
                      {item.action}
                    </code>
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
