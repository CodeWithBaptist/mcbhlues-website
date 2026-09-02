"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronsDownUp,
  ChevronsUpDown,
  Loader2,
  Lock,
  Plus,
  RotateCcw,
  Save,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Can, useSession } from "./permission-provider";
import { StatCard } from "./stat-card";
import { Card } from "./ui";

interface RoleRow {
  id: string;
  key: string;
  name: string;
  description: string;
  level: number;
  isSystem: boolean;
  memberCount: number;
  permissions: string[];
}

interface PermissionRow {
  key: string;
  module: string;
  description: string;
}

const SUPER_LEVEL = 100;

/** Colour-codes hierarchy bands so level numbers are scannable at a glance. */
function levelChipClass(level: number): string {
  if (level >= SUPER_LEVEL) return "bg-violet-50 text-violet-700 ring-violet-200";
  if (level >= 50) return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-sky-50 text-sky-700 ring-sky-200";
}

export function RolesManager({
  roles,
  permissions,
}: {
  roles: RoleRow[];
  permissions: PermissionRow[];
}) {
  const router = useRouter();
  const { user, can } = useSession();
  const [selectedId, setSelectedId] = useState(roles[0]?.id ?? "");
  const [draft, setDraft] = useState<Record<string, string[]>>(
    Object.fromEntries(roles.map((role) => [role.id, role.permissions]))
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Adopt fresh server data after router.refresh() so saves, creates and
  // deletes show up — without clobbering unsaved drafts for roles the admin
  // is still editing. (Render-time adjustment pattern instead of an effect.)
  const [prevRoles, setPrevRoles] = useState(roles);
  if (prevRoles !== roles) {
    setPrevRoles(roles);
    setDraft((previous) => {
      const next: Record<string, string[]> = {};
      for (const role of roles) next[role.id] = previous[role.id] ?? role.permissions;
      return next;
    });
    if (!roles.some((role) => role.id === selectedId)) {
      setSelectedId(roles[0]?.id ?? "");
    }
  }

  const selected = roles.find((role) => role.id === selectedId);
  const editable =
    selected && can("role:update") && (user.level >= SUPER_LEVEL || user.level > selected.level);

  const filteredPermissions = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return permissions;
    return permissions.filter(
      (row) =>
        row.key.toLowerCase().includes(term) ||
        row.module.toLowerCase().includes(term) ||
        row.description.toLowerCase().includes(term)
    );
  }, [permissions, query]);

  const modules = useMemo(
    () => [...new Set(filteredPermissions.map((row) => row.module))],
    [filteredPermissions]
  );

  const stats = useMemo(
    () => ({
      roles: roles.length,
      system: roles.filter((role) => role.isSystem).length,
      custom: roles.filter((role) => !role.isSystem).length,
      members: roles.reduce((sum, role) => sum + role.memberCount, 0),
    }),
    [roles]
  );

  /** Unsaved-change tracking against the last saved (server) state. */
  const dirty = useMemo(() => {
    if (!selected) return false;
    const before = [...selected.permissions].sort();
    const after = [...(draft[selected.id] ?? [])].sort();
    return before.length !== after.length || before.some((key, index) => key !== after[index]);
  }, [selected, draft]);

  const dirtyById = useMemo(() => {
    const result: Record<string, boolean> = {};
    for (const role of roles) {
      const before = [...role.permissions].sort();
      const after = [...(draft[role.id] ?? [])].sort();
      result[role.id] =
        before.length !== after.length || before.some((key, index) => key !== after[index]);
    }
    return result;
  }, [roles, draft]);

  function toggle(key: string) {
    if (!selected) return;
    setDraft((previous) => {
      const current = previous[selected.id] ?? [];
      return {
        ...previous,
        [selected.id]: current.includes(key)
          ? current.filter((entry) => entry !== key)
          : [...current, key],
      };
    });
  }

  /** Selects every permission the admin can grant inside one module, or clears the module. */
  function setModuleSelection(module: string, grant: boolean) {
    if (!selected) return;
    const rows = filteredPermissions.filter((row) => row.module === module);
    setDraft((previous) => {
      const current = new Set(previous[selected.id] ?? []);
      for (const row of rows) {
        if (grant) {
          if (user.level >= SUPER_LEVEL || user.permissions.includes(row.key)) current.add(row.key);
        } else {
          current.delete(row.key);
        }
      }
      return { ...previous, [selected.id]: [...current] };
    });
  }

  function resetDraft() {
    if (!selected) return;
    setDraft((previous) => ({ ...previous, [selected.id]: selected.permissions }));
  }

  async function save() {
    if (!selected) return;
    setSaving(true);
    setMessage(null);
    const response = await fetch(`/api/portal/roles/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissions: draft[selected.id] ?? [] }),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setMessage({ tone: "error", text: data.error ?? "Unable to update the role." });
      return;
    }
    setMessage({ tone: "ok", text: `${selected.name} permissions updated.` });
    router.refresh();
  }

  async function remove(role: RoleRow) {
    if (!confirm(`Delete the ${role.name} role?`)) return;
    const response = await fetch(`/api/portal/roles/${role.id}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage({ tone: "error", text: data.error ?? "Unable to delete the role." });
      return;
    }
    if (selectedId === role.id) setSelectedId("");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------------- */}
      {/*  Overview                                                         */}
      {/* ---------------------------------------------------------------- */}
      <div className="portal-stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Roles" value={`${stats.roles}`} hint="Across the hierarchy" icon="ShieldCheck" tone="primary" />
        <StatCard label="System roles" value={`${stats.system}`} hint="Protected, cannot be deleted" icon="Lock" tone="violet" />
        <StatCard label="Custom roles" value={`${stats.custom}`} hint="Created by your team" icon="Shield" tone="amber" />
        <StatCard label="Members covered" value={`${stats.members}`} hint="Role assignments in total" icon="Users" tone="emerald" />
      </div>

      {message && (
        <p
          className={cn(
            "portal-enter flex items-start gap-2 rounded-lg border px-3.5 py-2.5 text-sm",
            message.tone === "ok"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          )}
        >
          {message.tone === "ok" ? (
            <Check className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <X className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          {message.text}
        </p>
      )}

      <div className="flex justify-end">
        <Can permission="role:create">
          <Button onClick={() => setCreating((value) => !value)}>
            {creating ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            {creating ? "Close" : "New role"}
          </Button>
        </Can>
      </div>

      {creating && can("role:create") && (
        <div className="portal-enter">
          <CreateRoleForm
            maxLevel={user.level}
            onDone={() => {
              setCreating(false);
              setMessage({ tone: "ok", text: "Role created — select it in the list to grant permissions." });
              router.refresh();
            }}
            onError={(text) => setMessage({ tone: "error", text })}
          />
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {/* ------------------------------------------------------------ */}
        {/*  Role list                                                    */}
        {/* ------------------------------------------------------------ */}
        <Card title="Roles" description={`${roles.length} role(s), ordered by level`} className="lg:col-span-1">
          <ul className="space-y-2">
            {roles.map((role) => {
              const active = role.id === selectedId;
              return (
                <li key={role.id}>
                  <div
                    className={cn(
                      "group relative w-full rounded-xl border px-3.5 py-3 text-left transition-all",
                      active
                        ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30"
                        : "border-gray-200 bg-white hover:border-primary/40 hover:bg-blue-50/40"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedId(role.id)}
                      className="block w-full text-left"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-dark">{role.name}</span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1",
                            levelChipClass(role.level)
                          )}
                        >
                          Level {role.level}
                        </span>
                        {role.isSystem && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500 ring-1 ring-gray-200">
                            <Lock className="h-2.5 w-2.5" /> System
                          </span>
                        )}
                        {dirtyById[role.id] && (
                          <span
                            className="h-2 w-2 rounded-full bg-amber-400 ring-2 ring-amber-100"
                            title="Unsaved changes"
                          />
                        )}
                      </div>
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                        <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600">
                          {role.key}
                        </code>
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" /> {role.memberCount} member{role.memberCount === 1 ? "" : "s"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3" /> {role.permissions.length} permission{role.permissions.length === 1 ? "" : "s"}
                        </span>
                      </p>
                    </button>
                    {can("role:delete") && !role.isSystem && (
                      <button
                        type="button"
                        onClick={() => remove(role)}
                        title={`Delete ${role.name}`}
                        aria-label={`Delete ${role.name}`}
                        className="absolute right-2.5 top-2.5 rounded-lg border border-transparent p-1.5 text-gray-300 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* ------------------------------------------------------------ */}
        {/*  Permission editor                                            */}
        {/* ------------------------------------------------------------ */}
        <Card
          title={selected ? `${selected.name} permissions` : "Permissions"}
          description={selected ? selected.description || "Select permissions for this role." : undefined}
          className="lg:col-span-2"
          actions={
            selected ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCollapsed({})}
                  className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <ChevronsUpDown className="h-3 w-3" /> Expand
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCollapsed(Object.fromEntries(modules.map((module) => [module, true])))
                  }
                  className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-500 transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <ChevronsDownUp className="h-3 w-3" /> Collapse
                </button>
              </div>
            ) : undefined
          }
        >
          {!selected && <p className="text-sm text-gray-500">Select a role.</p>}
          {selected && !editable && (
            <p className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Read-only: this role sits at or above your own level, or you lack <code>role:update</code>.
            </p>
          )}
          {selected && (
            <div className="space-y-5">
              <div className="relative sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  className="pl-10"
                  placeholder="Filter permissions…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>

              {modules.length === 0 && (
                <p className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
                  No permissions match “{query}”.
                </p>
              )}

              {modules.map((module) => {
                const rows = filteredPermissions.filter((row) => row.module === module);
                const selectedInModule = rows.filter((row) =>
                  (draft[selected.id] ?? []).includes(row.key)
                ).length;
                const isCollapsed = Boolean(collapsed[module]);
                return (
                  <section key={module} className="overflow-hidden rounded-xl border border-gray-100">
                    <header className="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-gray-50/80 px-3.5 py-2">
                      <button
                        type="button"
                        onClick={() =>
                          setCollapsed((previous) => ({ ...previous, [module]: !isCollapsed }))
                        }
                        className="flex flex-1 items-center gap-2 text-left"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                          {module}
                        </p>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-medium ring-1",
                            selectedInModule > 0
                              ? "bg-primary/10 text-primary ring-primary/20"
                              : "bg-white text-gray-400 ring-gray-200"
                          )}
                        >
                          {selectedInModule}/{rows.length}
                        </span>
                      </button>
                      {editable && (
                        <span className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => setModuleSelection(module, true)}
                            className="rounded-md px-2 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary/10"
                          >
                            Select all
                          </button>
                          <button
                            type="button"
                            onClick={() => setModuleSelection(module, false)}
                            className="rounded-md px-2 py-1 text-[11px] font-medium text-gray-500 transition-colors hover:bg-gray-200/60"
                          >
                            Clear
                          </button>
                        </span>
                      )}
                    </header>

                    {!isCollapsed && (
                      <div className="grid gap-1.5 p-3 sm:grid-cols-2">
                        {rows.map((row) => {
                          const checked = (draft[selected.id] ?? []).includes(row.key);
                          const grantable =
                            user.level >= SUPER_LEVEL || user.permissions.includes(row.key);
                          return (
                            <label
                              key={row.key}
                              title={
                                grantable
                                  ? row.description
                                  : `${row.description} — you do not hold this permission, so you cannot toggle it.`
                              }
                              className={cn(
                                "flex items-start gap-2.5 rounded-lg border px-3 py-2 transition-colors",
                                checked
                                  ? "border-primary/40 bg-primary/5"
                                  : "border-gray-100 bg-white",
                                editable && grantable
                                  ? "cursor-pointer hover:border-primary/40"
                                  : "opacity-60"
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={!editable || !grantable}
                                onChange={() => toggle(row.key)}
                                className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-primary"
                              />
                              <span className="min-w-0">
                                <code className="block truncate text-xs font-medium text-gray-800">
                                  {row.key}
                                </code>
                                <span className="block truncate text-[11px] text-gray-400">
                                  {row.description}
                                </span>
                              </span>
                              {!grantable && (
                                <Lock className="ml-auto mt-0.5 h-3 w-3 shrink-0 text-gray-300" />
                              )}
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}

              {/* Floating save bar — keeps the primary action on screen while scrolling long catalogues. */}
              {editable && (
                <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white/90 px-4 py-3 shadow-lg backdrop-blur">
                  <p className="text-xs text-gray-500">
                    <strong className="font-semibold text-dark">
                      {(draft[selected.id] ?? []).length}
                    </strong>{" "}
                    permission{(draft[selected.id] ?? []).length === 1 ? "" : "s"} selected
                    {dirty && (
                      <span className="ml-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700 ring-1 ring-amber-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        Unsaved changes
                      </span>
                    )}
                  </p>
                  <div className="flex gap-2">
                    {dirty && (
                      <Button variant="outline" size="sm" onClick={resetDraft} type="button">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset
                      </Button>
                    )}
                    <Button size="sm" onClick={save} disabled={saving || !dirty}>
                      {saving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="mr-2 h-4 w-4" />
                      )}
                      Save changes
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function CreateRoleForm({
  maxLevel,
  onDone,
  onError,
}: {
  maxLevel: number;
  onDone: () => void;
  onError: (message: string) => void;
}) {
  const [form, setForm] = useState({ name: "", key: "", description: "", level: 10 });
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch("/api/portal/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      onError(data.error ?? "Unable to create the role.");
      return;
    }
    onDone();
  }

  return (
    <Card title="New role" description="Custom roles are stored alongside the built-in ones.">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700">Name</span>
          <Input
            value={form.name}
            onChange={(event) =>
              setForm({
                ...form,
                name: event.target.value,
                key: form.key || event.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
              })
            }
            autoFocus
            required
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700">Key</span>
          <Input
            value={form.key}
            onChange={(event) => setForm({ ...form, key: event.target.value })}
            placeholder="e.g. senior_agent"
            required
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-gray-700">Description</span>
          <Input
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-gray-700">
            Level (must be below {maxLevel})
          </span>
          <Input
            type="number"
            value={form.level}
            min={1}
            max={Math.max(1, maxLevel - 1)}
            onChange={(event) => setForm({ ...form, level: Number(event.target.value) })}
          />
        </label>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="mr-2 h-4 w-4" />
            )}
            Create role
          </Button>
        </div>
      </form>
    </Card>
  );
}
