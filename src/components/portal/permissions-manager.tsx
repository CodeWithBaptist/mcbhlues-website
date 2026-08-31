"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Can, useSession } from "./permission-provider";
import { Card } from "./ui";

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
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visible = permissions.filter(
    (row) =>
      row.key.includes(filter.toLowerCase()) ||
      row.module.toLowerCase().includes(filter.toLowerCase())
  );
  const modules = [...new Set(visible.map((row) => row.module))];

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          className="max-w-xs"
          placeholder="Filter permissions…"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        />
        <Can permission="permission:update">
          <Button onClick={() => setCreating((value) => !value)}>
            <Plus className="mr-2 h-4 w-4" />
            {creating ? "Close" : "New permission"}
          </Button>
        </Can>
      </div>

      {creating && can("permission:update") && (
        <CreatePermissionForm
          onDone={() => {
            setCreating(false);
            router.refresh();
          }}
          onError={setError}
        />
      )}

      <Card
        title="Permission matrix"
        description="Which role currently holds each permission (edit assignments on the Roles page)."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                <th className="px-3 py-2">Permission</th>
                {roles.map((role) => (
                  <th key={role.key} className="px-3 py-2 text-center">
                    {role.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modules.map((module) => (
                <Fragment key={module}>
                  <tr className="bg-gray-50">
                    <td
                      colSpan={roles.length + 1}
                      className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      {module}
                    </td>
                  </tr>
                  {visible
                    .filter((row) => row.module === module)
                    .map((row) => (
                      <tr key={row.key} className="border-b border-gray-50">
                        <td className="px-3 py-2">
                          <code className="text-xs text-gray-800">{row.key}</code>
                          {!row.isSystem && (
                            <span className="ml-2 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-700">
                              custom
                            </span>
                          )}
                          <p className="text-xs text-gray-400">{row.description}</p>
                        </td>
                        {roles.map((role) => (
                          <td key={role.key} className="px-3 py-2 text-center">
                            {role.permissions.includes(row.key) ? (
                              <span className="text-green-600">✓</span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
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
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create permission
          </Button>
        </div>
      </form>
    </Card>
  );
}
