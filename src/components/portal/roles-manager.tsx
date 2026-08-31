"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Can, useSession } from "./permission-provider";
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

  const selected = roles.find((role) => role.id === selectedId);
  const modules = [...new Set(permissions.map((row) => row.module))];
  const editable =
    selected && can("role:update") && (user.level >= SUPER_LEVEL || user.level > selected.level);

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
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {message && (
        <p
          className={
            message.tone === "ok"
              ? "rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700"
              : "rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          }
        >
          {message.text}
        </p>
      )}

      <Can permission="role:create">
        <div className="flex justify-end">
          <Button onClick={() => setCreating((value) => !value)}>
            <Plus className="mr-2 h-4 w-4" />
            {creating ? "Close" : "New role"}
          </Button>
        </div>
      </Can>

      {creating && can("role:create") && (
        <CreateRoleForm
          maxLevel={user.level}
          onDone={() => {
            setCreating(false);
            router.refresh();
          }}
          onError={(text) => setMessage({ tone: "error", text })}
        />
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Roles" description={`${roles.length} role(s)`} className="lg:col-span-1">
          <ul className="space-y-2">
            {roles.map((role) => (
              <li key={role.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(role.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                    role.id === selectedId
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-dark">{role.name}</span>
                    {role.isSystem && (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                        system
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-gray-500">
                    <code>{role.key}</code> · level {role.level} · {role.memberCount} member(s) ·{" "}
                    {role.permissions.length} permissions
                  </p>
                </button>
                {can("role:delete") && !role.isSystem && (
                  <button
                    type="button"
                    onClick={() => remove(role)}
                    className="mt-1 inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                )}
              </li>
            ))}
          </ul>
        </Card>

        <Card
          title={selected ? `${selected.name} permissions` : "Permissions"}
          description={selected?.description}
          className="lg:col-span-2"
          actions={
            editable ? (
              <Button size="sm" onClick={save} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save
              </Button>
            ) : undefined
          }
        >
          {!selected && <p className="text-sm text-gray-500">Select a role.</p>}
          {selected && !editable && (
            <p className="mb-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Read-only: this role sits at or above your own level, or you lack{" "}
              <code>role:update</code>.
            </p>
          )}
          {selected && (
            <div className="space-y-5">
              {modules.map((module) => (
                <div key={module}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {module}
                  </p>
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {permissions
                      .filter((row) => row.module === module)
                      .map((row) => {
                        const checked = (draft[selected.id] ?? []).includes(row.key);
                        const grantable = user.permissions.includes(row.key);
                        return (
                          <label
                            key={row.key}
                            title={row.description}
                            className={`flex items-center gap-2 rounded border px-2.5 py-1.5 text-xs ${
                              checked ? "border-primary/40 bg-primary/5" : "border-gray-200"
                            } ${editable && grantable ? "cursor-pointer" : "opacity-70"}`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              disabled={!editable || !grantable}
                              onChange={() => toggle(row.key)}
                            />
                            <code className="truncate text-gray-700">{row.key}</code>
                          </label>
                        );
                      })}
                  </div>
                </div>
              ))}
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
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create role
          </Button>
        </div>
      </form>
    </Card>
  );
}
