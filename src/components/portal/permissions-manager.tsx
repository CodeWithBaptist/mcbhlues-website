"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, KeyRound, Loader2, Minus, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Can, useSession } from "./permission-provider";
import { StatCard } from "./stat-card";
import { Card, EmptyState } from "./ui";

interface PermissionRow {
  key: string;
  module: string;
  description: string;
  isSystem: boolean;
}

interface RoleSummary {
  key: string;
  name: string;
  permissions: string[];
}

export function PermissionsManager({
  permissions,
  roles,
}: {
  permissions: PermissionRow[];
  roles: RoleSummary[];
}) {
  const router = useRouter();
  const { can } = useSession();
  const [filter, setFilter] = useState("");
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allModules = useMemo(() => [...new Set(permissions.map((row) => row.module))], [permissions]);

  const stats = useMemo(
    () => ({
      total: permissions.length,
      custom: permissions.filter((row) => !row.isSystem).length,
      modules: allModules.length,
      coverage: roles.length
        ? Math.round(
            (roles.reduce(
              (sum, role) => sum + role.permissions.filter((key) => key !== "*").length,
              0
            ) /
              Math.max(1, permissions.length * roles.length)) *
              100
          )
        : 0,
    }),
    [permissions, roles, allModules]
  );

  const visible = useMemo(() => {
    const term = filter.trim().toLowerCase();
    return permissions.filter((row) => {
      if (moduleFilter !== "all" && row.module !== moduleFilter) return false;
      if (!term) return true;
      return (
        row.key.toLowerCase().includes(term) ||
        row.description.toLowerCase().includes(term) ||
        row.module.toLowerCase().includes(term)
      );
    });
  }, [permissions, filter, moduleFilter]);

  const modules = useMemo(() => [...new Set(visible.map((row) => row.module))], [visible]);

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------------- */}
      {/*  Overview                                                         */}
      {/* ---------------------------------------------------------------- */}
      <div className="portal-stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Permissions" value={`${stats.total}`} hint="Keys in the catalogue" icon="KeyRound" tone="primary" />
        <StatCard label="Modules" value={`${stats.modules}`} hint="Functional groupings" icon="LayoutGrid" tone="sky" />
        <StatCard label="Custom keys" value={`${stats.custom}`} hint="Added on top of the defaults" icon="Sparkles" tone="violet" />
        <StatCard label="Grant coverage" value={`${stats.coverage}%`} hint="Of role × permission cells granted" icon="ShieldCheck" tone="emerald" />
      </div>

      {error && (
        <p className="portal-enter flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
          <X className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {/* ---------------------------------------------------------------- */}
      {/*  Toolbar                                                          */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative sm:max-w-xs sm:flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Filter by key or description…"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            <ModuleChip
              label="All modules"
              count={permissions.length}
              active={moduleFilter === "all"}
              onClick={() => setModuleFilter("all")}
            />
            {allModules.map((module) => (
              <ModuleChip
                key={module}
                label={module}
                count={permissions.filter((row) => row.module === module).length}
                active={moduleFilter === module}
                onClick={() => setModuleFilter(module)}
              />
            ))}
          </div>
        </div>

        <Can permission="permission:update">
          <Button onClick={() => setCreating((value) => !value)} className="shrink-0">
            {creating ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            {creating ? "Close" : "New permission"}
          </Button>
        </Can>
      </div>

      {creating && can("permission:update") && (
        <div className="portal-enter">
          <CreatePermissionForm
            onDone={() => {
              setCreating(false);
              router.refresh();
            }}
            onError={setError}
          />
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/*  Access matrix                                                    */}
      {/* ---------------------------------------------------------------- */}
      <Card
        title="Access matrix"
        description={
          visible.length === permissions.length
            ? "Which role currently holds each permission — edit assignments on the Roles page."
            : `${visible.length} of ${permissions.length} permissions match the current filters.`
        }
      >
        {visible.length === 0 ? (
          <EmptyState
            title="No permissions match your filters"
            description="Try a different search term or module."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                  <th className="sticky top-0 z-10 bg-white/95 px-3 py-2.5 font-medium shadow-[0_1px_0_0_rgb(243_244_246)] backdrop-blur">
                    Permission
                  </th>
                  {roles.map((role) => (
                    <th
                      key={role.key}
                      className="sticky top-0 z-10 bg-white/95 px-3 py-2.5 text-center font-medium shadow-[0_1px_0_0_rgb(243_244_246)] backdrop-blur"
                    >
                      <span className="block text-gray-700">{role.name}</span>
                      <span className="block text-[10px] normal-case tracking-normal text-gray-400">
                        {role.permissions.includes("*")
                          ? "all granted"
                          : `${role.permissions.length} granted`}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {modules.map((module) => {
                  const rows = visible.filter((row) => row.module === module);
                  return (
                    <Fragment key={module}>
                      <tr className="bg-gray-50/80">
                        <td
                          colSpan={roles.length + 1}
                          className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500"
                        >
                          <span className="inline-flex items-center gap-2">
                            {module}
                            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium normal-case tracking-normal text-gray-400 ring-1 ring-gray-200">
                              {rows.length} permission{rows.length === 1 ? "" : "s"}
                            </span>
                          </span>
                        </td>
                      </tr>
                      {rows.map((row) => (
                        <tr
                          key={row.key}
                          className="border-b border-gray-50 transition-colors last:border-0 hover:bg-blue-50/40"
                        >
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <code className="rounded bg-gray-50 px-1.5 py-0.5 text-xs font-medium text-gray-800 ring-1 ring-gray-100">
                                {row.key}
                              </code>
                              {!row.isSystem && (
                                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700 ring-1 ring-blue-100">
                                  custom
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-gray-400">{row.description}</p>
                          </td>
                          {roles.map((role) => {
                            const granted =
                              role.permissions.includes("*") ||
                              role.permissions.includes(row.key);
                            return (
                              <td key={role.key} className="px-3 py-2.5 text-center">
                                {granted ? (
                                  <span
                                    className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-700 ring-1 ring-green-200"
                                    title={`${role.name} holds ${row.key}`}
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </span>
                                ) : (
                                  <span className="inline-flex h-6 w-6 items-center justify-center text-gray-300">
                                    <Minus className="h-3.5 w-3.5" />
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function ModuleChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors",
        active
          ? "border-primary bg-primary text-white shadow-sm"
          : "border-gray-200 bg-white text-gray-600 hover:border-primary/40 hover:text-primary"
      )}
    >
      {label}
      <span
        className={cn(
          "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
          active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
        )}
      >
        {count}
      </span>
    </button>
  );
}

function CreatePermissionForm({
  onDone,
  onError,
}: {
  onDone: () => void;
  onError: (message: string) => void;
}) {
  const [form, setForm] = useState({ key: "", module: "Custom", description: "" });
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch("/api/portal/permissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      onError(data.error ?? "Unable to create the permission.");
      return;
    }
    onDone();
  }

  return (
    <Card title="New permission" description="Use the resource:action convention, e.g. contract:sign.">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700">Key</span>
          <Input
            value={form.key}
            onChange={(event) => setForm({ ...form, key: event.target.value })}
            placeholder="contract:sign"
            autoFocus
            required
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700">Module</span>
          <Input
            value={form.module}
            onChange={(event) => setForm({ ...form, module: event.target.value })}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700">Description</span>
          <Input
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </label>
        <div className="sm:col-span-3">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="mr-2 h-4 w-4" />
            )}
            Create permission
          </Button>
        </div>
      </form>
    </Card>
  );
}
