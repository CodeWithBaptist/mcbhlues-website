"use client";

import { useEffect, useState } from "react";

function greeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** The dashboard uses the same editorial heading hierarchy as the website. */
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
    return () => { clearTimeout(initial); clearInterval(timer); };
  }, []);

  return (
    <section className="flex flex-col justify-between gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-end">
      <div className="min-w-0">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
          {now ? greeting(now.getHours()) : "Welcome"}
        </p>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-dark sm:text-3xl">Hello, {firstName}</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          {roles.length > 0 ? roles.join(" · ") : "No role assigned"}
          <span className="mx-2" aria-hidden="true">·</span>
          {permissionCount} permissions · {moduleCount} modules
        </p>
      </div>
      <div className="shrink-0 text-sm text-gray-500 sm:text-right">
        <p>{now ? now.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "Loading date…"}</p>
        <p className="mt-1 text-xs tabular-nums">{now ? now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "--:--"}</p>
      </div>
    </section>
  );
}
