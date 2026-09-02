"use client";

import { useEffect, useState } from "react";
import { Activity, CheckCircle2, Loader2, RefreshCw, XCircle } from "lucide-react";
import { Card } from "./ui";

/**
 * Live status strip on the System Settings page: pings /api/health so an admin
 * can tell at a glance whether the database behind every setting is reachable,
 * alongside a few counters that prove the configuration is in use.
 */
export function SystemHealth({ stats }: { stats: { label: string; value: string }[] }) {
  const [state, setState] = useState<"checking" | "ok" | "down">("checking");
  const [checkedAt, setCheckedAt] = useState<string>("");

  async function check() {
    setState("checking");
    try {
      const response = await fetch("/api/health", { cache: "no-store" });
      setState(response.ok ? "ok" : "down");
    } catch {
      setState("down");
    }
    setCheckedAt(new Date().toLocaleTimeString());
  }

  useEffect(() => {
    const initial = setTimeout(check, 0);
    const timer = setInterval(check, 60_000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, []);

  return (
    <Card
      title="System health"
      description={checkedAt ? `Last checked ${checkedAt}` : "Checking services…"}
      actions={
        <button
          type="button"
          onClick={check}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-primary hover:text-primary"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div
          className={
            state === "ok"
              ? "flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3"
              : state === "down"
                ? "flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3"
                : "flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3"
          }
        >
          {state === "checking" ? (
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          ) : state === "ok" ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600" />
          )}
          <div>
            <p className="text-[11px] uppercase tracking-wide text-gray-500">Database</p>
            <p className="text-sm font-semibold text-dark">
              {state === "checking" ? "Checking…" : state === "ok" ? "Connected" : "Unreachable"}
            </p>
          </div>
        </div>

        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-gray-200 bg-white px-4 py-3">
            <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-gray-500">
              <Activity className="h-3 w-3 text-primary" /> {stat.label}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-dark">{stat.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
