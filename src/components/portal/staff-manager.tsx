"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  KeyRound,
  Loader2,
  Mail,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Can, useSession } from "./permission-provider";
import { Card, EmptyState, StatusPill } from "./ui";

export interface StaffRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
  roles: { id: string; key: string; name: string; level: number }[];
  level: number;
}

export interface RoleOption {
  id: string;
  key: string;
  name: string;
  level: number;
  isAssignable: boolean;
}

export interface PermissionOption {
  key: string;
  module: string;
  description: string;
}

const SUPER_LEVEL = 100;

export function StaffManager({
  initialStaff,
  roles,
  permissions,
}: {
  initialStaff: StaffRow[];
  roles: RoleOption[];
  permissions: PermissionOption[];
}) {
  const router = useRouter();
  const { user, can } = useSession();

  const [staff] = useState(initialStaff);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [permissionTarget, setPermissionTarget] = useState<StaffRow | null>(null);

  /** Mirrors the server-side hierarchy rule so the UI does not offer impossible actions. */
  const canAdminister = (row: StaffRow) =>
    row.id === user.id || user.level >= SUPER_LEVEL || user.level > row.level;

  const assignableRoles = useMemo(
    () => roles.filter((role) => role.isAssignable && (user.level >= SUPER_LEVEL || user.level > role.level)),
    [roles, user.level]
  );

  async function call(key: string, url: string, init?: RequestInit) {
    setBusy(key);
    setMessage(null);
    try {
      const response = await fetch(url, {
        ...init,
        headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ tone: "error", text: data.error ?? "Request failed." });
        return null;
      }
      router.refresh();
      return data;
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-5">
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

      {inviteLink && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
          <span className="font-medium">Secure invitation link:</span>
          <code className="truncate rounded bg-white px-2 py-1 text-xs">{inviteLink}</code>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(`${window.location.origin}${inviteLink}`)}
            className="inline-flex items-center gap-1 text-xs font-semibold underline"
          >
            <Copy className="h-3 w-3" /> Copy
          </button>
        </div>
      )}

      <Can permission="staff:create">
        <div className="flex justify-end">
          <Button onClick={() => setShowCreate((value) => !value)}>
            <Plus className="mr-2 h-4 w-4" />
            {showCreate ? "Close" : "Add staff member"}
          </Button>
        </div>
      </Can>

      {showCreate && can("staff:create") && (
        <CreateStaffForm
          roles={assignableRoles}
          canAssignRole={can("staff:assign_role")}
          canInvite={can("staff:invite")}
          onDone={(link) => {
            setShowCreate(false);
            setInviteLink(link);
            setMessage({ tone: "ok", text: "Staff account created." });
            router.refresh();
          }}
          onError={(text) => setMessage({ tone: "error", text })}
        />
      )}

      <Card title="Staff accounts" description={`${staff.length} account(s)`}>
        {staff.length === 0 ? (
          <EmptyState title="No staff accounts yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2">Staff</th>
                  <th className="px-3 py-2">Roles</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Last login</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((row) => {
                  const manageable = canAdminister(row);
                  return (
                    <tr key={row.id} className="border-b border-gray-50 align-top">
                      <td className="px-3 py-3">
                        <p className="font-semibold text-dark">
                          {row.firstName} {row.lastName}
                          {row.id === user.id && (
                            <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                              you
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">{row.email}</p>
                        {row.phone && <p className="text-xs text-gray-400">{row.phone}</p>}
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {row.roles.map((role) => (
                            <span
                              key={role.id}
                              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                            >
                              {role.name}
                              {can("staff:remove_role") && manageable && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    call(
                                      `${row.id}-role-${role.id}`,
                                      `/api/portal/staff/${row.id}/roles?roleId=${role.id}`,
                                      { method: "DELETE" }
                                    )
                                  }
                                  className="ml-0.5 text-primary/60 hover:text-red-600"
                                  aria-label={`Remove ${role.name}`}
                                >
                                  ×
                                </button>
                              )}
                            </span>
                          ))}
                          {row.roles.length === 0 && (
                            <span className="text-xs text-gray-400">No role</span>
                          )}
                        </div>

                        {can("staff:assign_role") && manageable && assignableRoles.length > 0 && (
                          <select
                            className="mt-2 rounded border border-gray-200 px-2 py-1 text-xs"
                            value=""
                            onChange={(event) => {
                              if (!event.target.value) return;
                              call(`${row.id}-assign`, `/api/portal/staff/${row.id}/roles`, {
                                method: "POST",
                                body: JSON.stringify({ roleId: event.target.value }),
                              });
                            }}
                          >
                            <option value="">+ Assign role…</option>
                            {assignableRoles
                              .filter((role) => !row.roles.some((assigned) => assigned.id === role.id))
                              .map((role) => (
                                <option key={role.id} value={role.id}>
                                  {role.name}
                                </option>
                              ))}
                          </select>
                        )}
                      </td>

                      <td className="px-3 py-3">
                        <StatusPill status={row.status} />
                      </td>

                      <td className="px-3 py-3 text-xs text-gray-500">
                        {row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString() : "Never"}
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <Can permission="staff:invite">
                            <IconAction
                              disabled={!manageable || busy !== null}
                              title="Send invitation link"
                              onClick={async () => {
                                const data = await call(
                                  `${row.id}-invite`,
                                  `/api/portal/staff/${row.id}/invite`,
                                  { method: "POST" }
                                );
                                if (data?.invitation) setInviteLink(data.invitation.url);
                              }}
                            >
                              <Mail className="h-3.5 w-3.5" />
                            </IconAction>
                          </Can>

                          <Can permission="staff:reset_password">
                            <IconAction
                              disabled={!manageable || busy !== null}
                              title="Reset password"
                              onClick={async () => {
                                const data = await call(
                                  `${row.id}-reset`,
                                  `/api/portal/staff/${row.id}/reset-password`,
                                  { method: "POST" }
                                );
                                if (data?.invitation) setInviteLink(data.invitation.url);
                              }}
                            >
                              <KeyRound className="h-3.5 w-3.5" />
                            </IconAction>
                          </Can>

                          <Can permission="staff:manage_permissions">
                            <IconAction
                              disabled={!manageable}
                              title="Individual permissions"
                              onClick={() => setPermissionTarget(row)}
                            >
                              <SlidersHorizontal className="h-3.5 w-3.5" />
                            </IconAction>
                          </Can>

                          <Can permission="staff:disable">
                            <IconAction
                              disabled={!manageable || row.id === user.id || busy !== null}
                              title={row.status === "active" ? "Disable account" : "Activate account"}
                              onClick={() =>
                                call(`${row.id}-status`, `/api/portal/staff/${row.id}/status`, {
                                  method: "POST",
                                  body: JSON.stringify({
                                    status: row.status === "active" ? "disabled" : "active",
                                  }),
                                })
                              }
                            >
                              {row.status === "active" ? (
                                <UserX className="h-3.5 w-3.5" />
                              ) : (
                                <UserCheck className="h-3.5 w-3.5" />
                              )}
                            </IconAction>
                          </Can>

                          <Can permission="staff:delete">
                            <IconAction
                              danger
                              disabled={!manageable || row.id === user.id || busy !== null}
                              title="Remove account"
                              onClick={() => {
                                if (!confirm(`Remove ${row.email}? This cannot be undone.`)) return;
                                call(`${row.id}-delete`, `/api/portal/staff/${row.id}`, {
                                  method: "DELETE",
                                });
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </IconAction>
                          </Can>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {permissionTarget && (
        <IndividualPermissions
          staff={permissionTarget}
          permissions={permissions}
          grantorPermissions={user.permissions}
          onClose={() => setPermissionTarget(null)}
          onSaved={() => {
            setPermissionTarget(null);
            setMessage({ tone: "ok", text: "Individual permissions updated." });
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function IconAction({
  children,
  onClick,
  title,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={`rounded border p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        danger
          ? "border-red-200 text-red-600 hover:bg-red-50"
          : "border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
      }`}
    >
      {children}
    </button>
  );
}

function CreateStaffForm({
  roles,
  canAssignRole,
  canInvite,
  onDone,
  onError,
}: {
  roles: RoleOption[];
  canAssignRole: boolean;
  canInvite: boolean;
  onDone: (inviteLink: string | null) => void;
  onError: (message: string) => void;
}) {
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", roleId: "" });
  const [sendInvite, setSendInvite] = useState(true);
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch("/api/portal/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        roleIds: form.roleId ? [form.roleId] : [],
        sendInvite: canInvite && sendInvite,
      }),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      onError(data.error ?? "Unable to create the staff account.");
      return;
    }
    onDone(data.invitation?.url ?? null);
  }

  return (
    <Card title="New staff account" description="The staff member sets their own password via the invitation link.">
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="First name">
          <Input
            value={form.firstName}
            onChange={(event) => setForm({ ...form, firstName: event.target.value })}
            required
          />
        </Field>
        <Field label="Last name">
          <Input
            value={form.lastName}
            onChange={(event) => setForm({ ...form, lastName: event.target.value })}
            required
          />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
        </Field>
        <Field label="Phone number">
          <Input
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value })}
          />
        </Field>

        {canAssignRole && (
          <Field label="Role">
            <select
              className="h-12 w-full rounded-md border border-gray-200 px-3 text-sm"
              value={form.roleId}
              onChange={(event) => setForm({ ...form, roleId: event.target.value })}
            >
              <option value="">No role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </Field>
        )}

        {canInvite && (
          <label className="flex items-center gap-2 self-end pb-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={sendInvite}
              onChange={(event) => setSendInvite(event.target.checked)}
            />
            Generate a secure invitation
          </label>
        )}

        <div className="sm:col-span-2">
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create staff account
          </Button>
        </div>
      </form>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

function IndividualPermissions({
  staff,
  permissions,
  grantorPermissions,
  onClose,
  onSaved,
}: {
  staff: StaffRow;
  permissions: PermissionOption[];
  grantorPermissions: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [overrides, setOverrides] = useState<Record<string, "allow" | "deny">>({});
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/portal/staff/${staff.id}/permissions`)
      .then((response) => response.json())
      .then((data) => {
        const next: Record<string, "allow" | "deny"> = {};
        for (const row of data.overrides ?? []) next[row.key] = row.effect;
        setOverrides(next);
      })
      .finally(() => setLoaded(true));
  }, [staff.id]);

  const modules = [...new Set(permissions.map((row) => row.module))];

  async function save() {
    setSaving(true);
    setError(null);
    const response = await fetch(`/api/portal/staff/${staff.id}/permissions`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        overrides: Object.entries(overrides).map(([key, effect]) => ({ key, effect })),
      }),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setError(data.error ?? "Unable to save.");
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-xl bg-white shadow-2xl">
        <header className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-heading text-base font-bold text-dark">
            Individual permissions — {staff.firstName} {staff.lastName}
          </h2>
          <p className="text-xs text-gray-500">
            Overrides are layered on top of the role permissions. A deny always wins.
          </p>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {!loaded && <p className="text-sm text-gray-500">Loading…</p>}
          {loaded &&
            modules.map((module) => (
              <div key={module}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {module}
                </p>
                <div className="space-y-1">
                  {permissions
                    .filter((row) => row.module === module)
                    .map((row) => {
                      const current = overrides[row.key];
                      const grantable = grantorPermissions.includes(row.key);
                      return (
                        <div
                          key={row.key}
                          className="flex flex-wrap items-center justify-between gap-2 rounded border border-gray-100 px-3 py-1.5 text-sm"
                        >
                          <div className="min-w-0">
                            <code className="text-xs text-gray-700">{row.key}</code>
                            <p className="truncate text-xs text-gray-400">{row.description}</p>
                          </div>
                          <div className="flex gap-1">
                            {(["allow", "deny", "inherit"] as const).map((option) => {
                              const active =
                                option === "inherit" ? !current : current === option;
                              const disabled = option === "allow" && !grantable;
                              return (
                                <button
                                  key={option}
                                  type="button"
                                  disabled={disabled}
                                  onClick={() =>
                                    setOverrides((previous) => {
                                      const next = { ...previous };
                                      if (option === "inherit") delete next[row.key];
                                      else next[row.key] = option;
                                      return next;
                                    })
                                  }
                                  className={`rounded border px-2 py-0.5 text-[11px] capitalize disabled:opacity-30 ${
                                    active
                                      ? option === "deny"
                                        ? "border-red-300 bg-red-50 text-red-700"
                                        : option === "allow"
                                          ? "border-green-300 bg-green-50 text-green-700"
                                          : "border-gray-300 bg-gray-100 text-gray-700"
                                      : "border-gray-200 text-gray-500"
                                  }`}
                                >
                                  {option}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
        </div>

        {error && <p className="px-5 pb-2 text-sm text-red-600">{error}</p>}

        <footer className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button onClick={save} disabled={saving} type="button">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <ShieldCheck className="mr-2 h-4 w-4" />
            Save overrides
          </Button>
        </footer>
      </div>
    </div>
  );
}
