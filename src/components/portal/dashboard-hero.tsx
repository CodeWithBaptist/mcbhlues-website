"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

function greeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Warm, time-aware welcome banner at the top of the portal dashboard, with a
 * live clock so the workspace feels alive rather than static.
 */
export function DashboardHero({
  firstName,
  roles,
  permissionCount,
  moduleCount,
}: {
  firstName: string;
  roles: string[];
  permissionCount: number;
  moduleCount: number;
}) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // Rendered client-side only so the server HTML never disagrees with the
    // browser clock; the first tick is queued rather than run synchronously.
    const tick = () => setNow(new Date());
    const initial = setTimeout(tick, 0);
    const timer = setInterval(tick, 30_000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, []);

  return (
    <section className="portal-enter relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-dark via-primary to-primary-light px-6 py-7 text-white shadow-lg">
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-24 right-24 h-48 w-48 rounded-full bg-white/10 blur-2xl" />

      <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-100">
            <Sparkles className="h-3.5 w-3.5" />
            {now ? greeting(now.getHours()) : "Welcome"}
          </p>
          <h1 className="mt-1 font-heading text-3xl font-extrabold">Hello, {firstName}</h1>
          <p className="mt-1 max-w-xl text-sm text-blue-100">
            {roles.length > 0 ? roles.join(" · ") : "No role assigned"} — {permissionCount} permissions across{" "}
            {moduleCount} modules.
          </p>
        </div>

        <div className="text-left md:text-right">
          <p className="font-heading text-2xl font-bold tabular-nums">
            {now
              ? now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
              : "--:--"}
          </p>
          <p className="text-xs text-blue-100">
            {now
              ? now.toLocaleDateString(undefined, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : ""}
          </p>
        </div>
      </div>
    </section>
  );
}
