"use client";

import Link from "next/link";
import * as Icons from "lucide-react";
import { ArrowRight, Zap } from "lucide-react";

/** One-tap shortcuts to the things staff do most, filtered by permission. */
export function QuickActions({ actions }: { actions: { label: string; href: string; icon: string }[] }) {
  if (actions.length === 0) return null;

  return (
    <section className="portal-enter rounded-xl border border-gray-200 bg-white p-4 shadow-soft">
      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
        <Zap className="h-3.5 w-3.5 text-primary" aria-hidden="true" /> Quick actions
      </p>
      <div className="portal-stagger flex flex-wrap gap-2">
        {actions.map((action) => {
          const Resolved =
            (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
              action.icon
            ] ?? Icons.Circle;
          return (
            <Link
              key={action.href + action.label}
              href={action.href}
              className="group portal-card-hover inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-primary/30 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Resolved className="h-4 w-4 text-primary transition-transform duration-300 ease-soft group-hover:scale-110" />
              {action.label}
              <ArrowRight
                className="h-3.5 w-3.5 -translate-x-1 text-gray-300 opacity-0 transition-all duration-300 ease-soft group-hover:translate-x-0 group-hover:text-primary group-hover:opacity-100"
                aria-hidden="true"
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
