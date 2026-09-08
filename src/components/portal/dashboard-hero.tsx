"use client";

import { useEffect, useState } from "react";
import { Clock3, ShieldCheck, Sparkles, LayoutGrid } from "lucide-react";

function greeting(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Warm, time-aware welcome banner at the top of the portal dashboard, with a
 * live clock so the workspace feels alive rather than static. Upgraded with
 * frosted meta pills and subtle depth to match the refreshed portal shell.
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
    <section className="portal-enter relative overflow-hidden rounded-[20px] bg-gradient-to-br from-[#0f2a64] via-[#1a3ea1] to-[#2a7fff] px-6 py-6 text-white shadow-[0_12px_32px_-16px_rgba(16,42,100,0.45),0_4px_12px_rgba(16,42,100,0.12)] ring-1 ring-white/10 sm:px-7 sm:py-7">
      {/* depth */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-white/[0.09] blur-3xl" />
        <div className="absolute -bottom-28 right-20 h-64 w-64 rounded-full bg-white/[0.07] blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(520px_220px_at_20%_0%,rgba(255,255,255,0.10),transparent)]" />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
      </div>

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-widest text-blue-100 ring-1 ring-white/15 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-blue-200" />
            {now ? greeting(now.getHours()) : "Welcome"}
            <span className="hidden h-3 w-px bg-white/20 sm:block" aria-hidden />
            <span className="hidden items-center gap-1 font-medium normal-case tracking-normal text-white/90 sm:inline-flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Portal live
            </span>
          </p>

          <h1 className="mt-3 font-heading text-[28px] font-extrabold leading-none tracking-tight sm:text-[32px]">
            Hello,{" "}
            <span className="bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              {firstName}
            </span>
            <span className="ml-2 inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400 align-super shadow-[0_0_12px_rgba(16,185,129,0.8)]" />
          </h1>

          <p className="mt-2 max-w-xl text-sm leading-relaxed text-blue-100/90">
            {roles.length > 0 ? roles.join(" · ") : "No role assigned"}
            <span className="mx-1.5 text-blue-200/40">•</span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-200" />
              {permissionCount} permissions
            </span>
            <span className="mx-1.5 text-blue-200/40">•</span>
            <span className="inline-flex items-center gap-1">
              <LayoutGrid className="h-3.5 w-3.5 text-blue-200" />
              {moduleCount} modules
            </span>
          </p>

          <div className="mt-4 hidden flex-wrap gap-2 sm:flex">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-primary-dark shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              All systems operational
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/15 backdrop-blur">
              Lagos • Victoria Island
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
          {/* Clock card */}
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/15 backdrop-blur-md sm:min-w-[200px]">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary shadow-sm ring-1 ring-white/20">
              <Clock3 className="h-5 w-5" />
            </span>
            <div className="min-w-0 text-left">
              <p className="font-heading text-[22px] font-bold leading-none tracking-tight tabular-nums">
                {now ? now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "--:--"}
              </p>
              <p className="mt-0.5 max-w-[16ch] truncate text-xs font-medium leading-tight text-blue-100">
                {now
                  ? now.toLocaleDateString(undefined, {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Loading date…"}
              </p>
            </div>
          </div>

          {/* Quick meta */}
          <div className="hidden grid-cols-2 gap-2 sm:grid lg:grid-cols-2">
            <div className="rounded-2xl bg-white px-4 py-3 text-primary-dark shadow-sm ring-1 ring-black/5">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">Modules</p>
              <p className="mt-0.5 font-heading text-xl font-extrabold leading-none">{moduleCount}</p>
              <p className="mt-1 text-xs font-medium text-gray-500">Available to you</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 text-white ring-1 ring-white/15 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-200">Access</p>
              <p className="mt-0.5 font-heading text-xl font-extrabold leading-none">{permissionCount}</p>
              <p className="mt-1 text-xs font-medium text-blue-100">Permissions</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
