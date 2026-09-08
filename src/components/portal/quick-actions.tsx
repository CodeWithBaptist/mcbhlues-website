"use client";

import Link from "next/link";
import * as Icons from "lucide-react";
import { ArrowRight, Zap } from "lucide-react";

/** One-tap shortcuts to the things staff do most, filtered by permission. */
export function QuickActions({ actions }: { actions: { label: string; href: string; icon: string }[] }) {
  if (actions.length === 0) return null;

  return (
    <section className="portal-enter overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.10)]">
      <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-b from-gray-50/60 to-white px-5 py-3.5">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-600">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
            <Zap className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          Quick actions
        </p>
        <span className="hidden rounded-full bg-gray-900 px-2 py-1 text-[11px] font-semibold text-white sm:inline-flex">
          {actions.length} shortcuts
        </span>
      </div>

      <div className="portal-stagger grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action) => {
          const Resolved =
            (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
              action.icon
            ] ?? Icons.Circle;
          return (
            <Link
              key={action.href + action.label}
              href={action.href}
              className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-300 ease-soft hover:-translate-y-0.5 hover:border-primary/15 hover:shadow-md hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-600 ring-1 ring-gray-200 transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:ring-primary group-hover:scale-[1.05]">
                <Resolved className="h-4.5 w-4.5 h-[18px] w-[18px] transition-transform group-hover:scale-110" />
              </span>
              <span className="min-w-0 flex-1 truncate">{action.label}</span>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400 ring-1 ring-gray-200 transition-all group-hover:bg-primary group-hover:text-white group-hover:ring-primary">
                <ArrowRight className="h-3.5 w-3.5 -translate-x-0.5 transition-transform duration-300 group-hover:translate-x-0" aria-hidden="true" />
              </span>
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 transition-all duration-700 group-hover:translate-x-full group-hover:opacity-100" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
