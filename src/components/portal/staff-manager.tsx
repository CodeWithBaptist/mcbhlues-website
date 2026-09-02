"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  KeyRound,
  Link2,
  Loader2,
  Lock,
  Mail,
  MailPlus,
  Minus,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Can, useSession } from "./permission-provider";
import { StatCard } from "./stat-card";
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

/** Deterministic gradient per person so avatars are colourful but stable. */
const AVATAR_GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-violet-500 to-purple-600",
  "from-rose-500 to-pink-600",
  "from-sky-500 to-cyan-600",
];

function avatarGradient(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) % 997;
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() || "·";
}

/** "3 min ago" style timestamps are easier to scan than full dates. */
function formatRelative(iso: string | null): string {
  if (!iso) return "Never";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "Never";
  const minutes = Math.max(0, Math.round((Date.now() - then) / 60_000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Avatar({ row, size = "md" }: { row: StaffRow; size?: "md" | "lg" }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-heading font-bold text-white shadow-sm ring-2 ring-white",
        avatarGradient(row.email),
        size === "md" ? "h-10 w-10 text-xs" : "h-12 w-12 text-sm"
      )}
      aria-hidden
    >
      {initials(row.firstName, row.lastName)}
    </span>
  );
}

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

  const [staff, setStaff] = useState(initialStaff);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "invited" | "disabled">(
    "all"
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [permissionTarget, setPermissionTarget] = useState<StaffRow | null>(null);
  const [editTarget, setEditTarget] = useState<StaffRow | null>(null);

  // After router.refresh() the server sends fresh props; adopt them so every
  // mutation (create, role change, status toggle) is reflected immediately.
  // (Render-time adjustment — the recommended alternative to syncing in an effect.)
  const [prevInitialStaff, setPrevInitialStaff] = useState(initialStaff);
  if (prevInitialStaff !== initialStaff) {
    setPrevInitialStaff(initialStaff);
    setStaff(initialStaff);
  }

  /** Mirrors the server-side hierarchy rule so the UI does not offer impossible actions. */
  const canAdminister = (row: StaffRow) =>
    row.id === user.id || user.level >= SUPER_LEVEL || user.level > row.level;

  const assignableRoles = useMemo(
    () => roles.filter((role) => role.isAssignable && (user.level >= SUPER_LEVEL || user.level > role.level)),
    [roles, user.level]
  );

  const stats = useMemo(
    () => ({
      total: staff.length,
      active: staff.filter((row) => row.status === "active").length,
      invited: staff.filter((row) => row.status === "invited").length,
      disabled: staff.filter((row) => row.status === "disabled").length,
    }),
    [staff]
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return staff.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (!term) return true;
      const haystack =
        `${row.firstName} ${row.lastName} ${row.email} ${row.phone} ${row.roles
          .map((role) => role.name)
          .join(" ")}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [staff, query, statusFilter]);

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

  const filterTabs = [
    { id: "all", label: "All", count: stats.total },
    { id: "active", label: "Active", count: stats.active },
    { id: "invited", label: "Invited", count: stats.invited },
    { id: "disabled", label: "Disabled", count: stats.disabled },
  ] as const;

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------------- */}
      {/*  Live overview                                                    */}
      {/* ---------------------------------------------------------------- */}
      <div className="portal-stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Team members" value={`${stats.total}`} hint="All staff accounts" icon="Users" tone="primary" />
        <StatCard label="Active" value={`${stats.active}`} hint="Can sign in now" icon="UserCheck" tone="emerald" />
        <StatCard label="Invited" value={`${stats.invited}`} hint="Awaiting first sign-in" icon="MailPlus" tone="amber" />
        <StatCard label="Disabled" value={`${stats.disabled}`} hint="Access suspended" icon="UserX" tone="slate" />
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

      {inviteLink && (
        <div className="portal-enter flex flex-wrap items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-sm text-blue-800">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <Link2 className="h-4 w-4" /> Secure invitation link
          </span>
          <code className="max-w-full truncate rounded-md bg-white px-2 py-1 text-xs ring-1 ring-blue-100">
            {inviteLink}
          </code>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(`${window.location.origin}${inviteLink}`)}
            className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-1 text-xs font-semibold text-primary ring-1 ring-blue-100 transition-colors hover:bg-blue-100"
          >
            <Copy className="h-3 w-3" /> Copy
          </button>
          <button
            type="button"
            onClick={() => setInviteLink(null)}
            className="ml-auto text-blue-400 transition-colors hover:text-blue-700"
            aria-label="Dismiss invitation link"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
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
              placeholder="Search by name, email or role…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  statusFilter === tab.id
                    ? "border-primary bg-primary text-white shadow-sm"
                    : "border-gray-200 bg-white text-gray-600 hover:border-primary/40 hover:text-primary"
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                    statusFilter === tab.id ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        <Can permission="staff:create">
          <Button onClick={() => setShowCreate((value) => !value)} className="shrink-0">
            {showCreate ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            {showCreate ? "Close" : "Add staff member"}
          </Button>
        </Can>
      </div>

      {showCreate && can("staff:create") && (
        <div className="portal-enter">
          <CreateStaffForm
            roles={assignableRoles}
            canAssignRole={can("staff:assign_role")}
            canInvite={can("staff:invite")}
            onDone={(link, emailed, email) => {
              setShowCreate(false);
              setInviteLink(link);
              setMessage(
                emailed
                  ? { tone: "ok", text: `Staff account created — the invitation was emailed to ${email}.` }
                  : {
                      tone: "ok",
                      text: link
                        ? "Staff account created. Email delivery is not configured yet, so share the invitation link manually."
                        : "Staff account created.",
                    }
              );
              router.refresh();
            }}
            onError={(text) => setMessage({ tone: "error", text })}
          />
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/*  Directory                                                        */}
      {/* ---------------------------------------------------------------- */}
      <Card
        title="Team directory"
        description={
          filtered.length === staff.length
            ? `${staff.length} account(s)`
            : `${filtered.length} of ${staff.length} account(s) match the current filters`
        }
      >
        {filtered.length === 0 ? (
          <EmptyState
            title={staff.length === 0 ? "No staff accounts yet" : "No staff match your filters"}
            description={
              staff.length === 0
                ? "Create the first account to get the team on board."
                : "Try a different search term or status filter."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2.5 font-medium">Team member</th>
                  <th className="px-3 py-2.5 font-medium">Roles</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Last login</th>
                  <th className="px-3 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => {
                  const manageable = canAdminister(row);
                  return (
                    <tr
                      key={row.id}
                      className="border-b border-gray-50 align-middle transition-colors last:border-0 hover:bg-blue-50/40"
                    >
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar row={row} />
                          <div className="min-w-0">
                            <p className="font-semibold text-dark">
                              {row.firstName} {row.lastName}
                              {row.id === user.id && (
                                <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                                  you
                                </span>
                              )}
                            </p>
                            <p className="truncate text-xs text-gray-500">{row.email}</p>
                            {row.phone && <p className="text-xs text-gray-400">{row.phone}</p>}
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {row.roles.map((role) => (
                            <span
                              key={role.id}
                              className="group inline-flex items-center gap-1 rounded-full bg-primary/10 py-0.5 pl-2.5 pr-1.5 text-xs font-medium text-primary ring-1 ring-primary/15"
                            >
                              <ShieldCheck className="h-3 w-3 text-primary/60" />
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
                                  className="rounded-full p-0.5 text-primary/50 transition-colors hover:bg-primary/15 hover:text-red-600"
                                  aria-label={`Remove ${role.name}`}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </span>
                          ))}
                          {row.roles.length === 0 && (
                            <span className="text-xs italic text-gray-400">No role assigned</span>
                          )}
                        </div>

                        {can("staff:assign_role") && manageable && assignableRoles.length > 0 && (
                          <select
                            className="mt-2 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 transition-colors hover:border-primary/40 focus:border-primary focus:outline-none"
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

                      <td className="px-3 py-3.5">
                        <StatusPill status={row.status} />
                      </td>

                      <td className="px-3 py-3.5">
                        <span
                          className="text-xs text-gray-500"
                          title={row.lastLoginAt ? new Date(row.lastLoginAt).toLocaleString() : undefined}
                        >
                          {formatRelative(row.lastLoginAt)}
                        </span>
                      </td>

                      <td className="px-3 py-3.5">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <Can permission="staff:update">
                            <IconAction
                              disabled={!manageable || busy !== null}
                              title="Edit name & details"
                              onClick={() => setEditTarget(row)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </IconAction>
                          </Can>

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
                                if (data?.invitation) {
                                  setInviteLink(data.invitation.url);
                                  setMessage(
                                    data.emailed
                                      ? { tone: "ok", text: `Invitation emailed to ${row.email} — the link below is a backup copy.` }
                                      : { tone: "ok", text: `Invitation created for ${row.email}. Email delivery is not configured, so share the link manually.` }
                                  );
                                }
                              }}
                            >
                              <Mail className="h-3.5 w-3.5" />
                            </IconAction>
                          </Can>

                          <Can permission="staff:reset_password">
                            <IconAction
                              disabled={!manageable || row.id === user.id || busy !== null}
                              title={row.id === user.id ? "Use Change Password to reset your own password" : "Reset password"}
                              onClick={async () => {
                                const data = await call(
                                  `${row.id}-reset`,
                                  `/api/portal/staff/${row.id}/reset-password`,
                                  { method: "POST" }
                                );
                                if (data?.invitation) {
                                  setInviteLink(data.invitation.url);
                                  setMessage(
                                    data.emailed
                                      ? { tone: "ok", text: `Password reset — the "set a new password" link was emailed to ${row.email}.` }
                                      : { tone: "ok", text: `Password reset for ${row.email}. Email delivery is not configured, so share the link manually.` }
                                  );
                                }
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
          onSaved={(count) => {
            setPermissionTarget(null);
            setMessage({
              tone: "ok",
              text: `Individual permissions updated — ${count} override(s) now set for ${permissionTarget.firstName} ${permissionTarget.lastName}.`,
            });
            router.refresh();
          }}
        />
      )}

      {editTarget && (
        <EditStaffDetails
          staff={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(updated) => {
            setEditTarget(null);
            setStaff((current) =>
              current.map((row) =>
                row.id === updated.id
                  ? {
                      ...row,
                      firstName: updated.firstName,
                      lastName: updated.lastName,
                      phone: updated.phone,
                    }
                  : row
              )
            );
            setMessage({
              tone: "ok",
              text: `Saved — ${updated.firstName} ${updated.lastName}'s details were updated.`,
            });
            router.refresh();
          }}
          onError={(text) => setMessage({ tone: "error", text })}
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
      className={cn(
        "rounded-lg border p-2 transition-all disabled:cursor-not-allowed disabled:opacity-40",
        danger
          ? "border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50"
          : "border-gray-200 bg-white text-gray-500 hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
      )}
    >
      {children}
    </button>
  );
}

/**
 * Shared modal shell for the staff dialogs: centered panel over a blurred
 * backdrop, Escape to close and body scroll locked while open.
 */
function ModalOverlay({
  onClose,
  children,
  wide,
}: {
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "portal-enter flex max-h-[86vh] w-full flex-col rounded-2xl bg-white shadow-2xl",
          wide ? "max-w-3xl" : "max-w-md"
        )}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({
  icon,
  title,
  subtitle,
  onClose,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onClose: () => void;
}) {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
      <div className="flex items-start gap-3">
        <span className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</span>
        <div>
          <h2 className="font-heading text-base font-bold text-dark">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
        aria-label="Close dialog"
      >
        <X className="h-4 w-4" />
      </button>
    </header>
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
  onDone: (inviteLink: string | null, emailed: boolean, email: string) => void;
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
    onDone(data.invitation?.url ?? null, Boolean(data.emailed), form.email);
  }

  return (
    <Card
      title="New staff account"
      description="The staff member sets their own password via the secure invitation link."
    >
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="First name">
          <Input
            value={form.firstName}
            onChange={(event) => setForm({ ...form, firstName: event.target.value })}
            autoFocus
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
              className="h-12 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-dark transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
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
          <label className="flex items-center gap-2.5 self-end pb-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={sendInvite}
              onChange={(event) => setSendInvite(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 accent-primary"
            />
            Generate a secure invitation
          </label>
        )}

        <div className="sm:col-span-2">
          <Button type="submit" disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <UserCheck className="mr-2 h-4 w-4" />
            )}
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

function EditStaffDetails({
  staff,
  onClose,
  onSaved,
  onError,
}: {
  staff: StaffRow;
  onClose: () => void;
  onSaved: (updated: { id: string; firstName: string; lastName: string; phone: string }) => void;
  onError: (message: string) => void;
}) {
  const [form, setForm] = useState({
    firstName: staff.firstName,
    lastName: staff.lastName,
    phone: staff.phone,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const response = await fetch(`/api/portal/staff/${staff.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
      }),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok || !data.staff) {
      const text = data.error ?? "Unable to update the staff member.";
      setError(text);
      onError(text);
      return;
    }
    onSaved({
      id: staff.id,
      firstName: data.staff.firstName,
      lastName: data.staff.lastName,
      phone: data.staff.phone,
    });
  }

  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader
        icon={<Pencil className="h-4 w-4" />}
        title="Edit staff details"
        subtitle={`Update the name and phone number for ${staff.email}. The sign-in email cannot be changed here.`}
        onClose={onClose}
      />
      <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-3.5 py-3 ring-1 ring-gray-100">
            <Avatar row={staff} size="lg" />
            <div className="min-w-0">
              <p className="font-semibold text-dark">
                {staff.firstName} {staff.lastName}
              </p>
              <p className="truncate text-xs text-gray-500">{staff.email}</p>
            </div>
          </div>
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
          <Field label="Phone number">
            <Input
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </Field>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <footer className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3.5">
          <Button variant="outline" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save changes
          </Button>
        </footer>
      </form>
    </ModalOverlay>
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
  onSaved: (overrideCount: number) => void;
}) {
  const [overrides, setOverrides] = useState<Record<string, "allow" | "deny">>({});
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

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

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return permissions;
    return permissions.filter(
      (row) =>
        row.key.toLowerCase().includes(term) ||
        row.module.toLowerCase().includes(term) ||
        row.description.toLowerCase().includes(term)
    );
  }, [permissions, query]);

  const modules = useMemo(() => [...new Set(filtered.map((row) => row.module))], [filtered]);

  const overrideCount = Object.keys(overrides).length;
  const allowCount = Object.values(overrides).filter((effect) => effect === "allow").length;
  const denyCount = Object.values(overrides).filter((effect) => effect === "deny").length;

  /** Clear every override for permissions visible in the current filter. */
  function clearVisible() {
    setOverrides((previous) => {
      const next = { ...previous };
      for (const row of filtered) delete next[row.key];
      return next;
    });
  }

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
    onSaved(Object.keys(overrides).length);
  }

  return (
    <ModalOverlay onClose={onClose} wide>
      <ModalHeader
        icon={<SlidersHorizontal className="h-4 w-4" />}
        title={
          staff.firstName + " " + staff.lastName + " — individual permissions"
        }
        subtitle="Overrides are layered on top of the role permissions. A deny always wins."
        onClose={onClose}
      />

      <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-5 py-3">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            className="h-10 pl-9 text-sm"
            placeholder="Filter permissions…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {overrideCount} override{overrideCount === 1 ? "" : "s"}
        </span>
        {allowCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700 ring-1 ring-green-200">
            <Check className="h-3 w-3" /> {allowCount} allow
          </span>
        )}
        {denyCount > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 ring-1 ring-red-200">
            <X className="h-3 w-3" /> {denyCount} deny
          </span>
        )}
        {overrideCount > 0 && (
          <button
            type="button"
            onClick={clearVisible}
            className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <RotateCcw className="h-3 w-3" />
            Clear {query ? "filtered" : "all"}
          </button>
        )}
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
        {!loaded && (
          <p className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading current overrides…
          </p>
        )}
        {loaded && modules.length === 0 && (
          <EmptyState
            title="No permissions match"
            description="Try a different filter term."
          />
        )}
        {loaded &&
          modules.map((module) => {
            const rows = filtered.filter((row) => row.module === module);
            const moduleOverrides = rows.filter((row) => overrides[row.key]).length;
            return (
              <div key={module}>
                <div className="mb-2 flex items-center gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {module}
                  </p>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                    {rows.length} permission{rows.length === 1 ? "" : "s"}
                  </span>
                  {moduleOverrides > 0 && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                      {moduleOverrides} overridden
                    </span>
                  )}
                </div>
                <div className="space-y-1.5">
                  {rows.map((row) => {
                    const current = overrides[row.key];
                    const grantable = grantorPermissions.includes(row.key);
                    return (
                      <div
                        key={row.key}
                        className={cn(
                          "flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                          current === "allow"
                            ? "border-green-200 bg-green-50/50"
                            : current === "deny"
                              ? "border-red-200 bg-red-50/50"
                              : "border-gray-100"
                        )}
                      >
                        <div className="min-w-0">
                          <code className="text-xs font-medium text-gray-800">{row.key}</code>
                          <p className="truncate text-xs text-gray-400">{row.description}</p>
                        </div>
                        <div className="flex overflow-hidden rounded-lg border border-gray-200">
                          {(
                            [
                              { id: "allow", icon: Check, label: "Allow" },
                              { id: "inherit", icon: Minus, label: "Inherit" },
                              { id: "deny", icon: X, label: "Deny" },
                            ] as const
                          ).map((option) => {
                            const active =
                              option.id === "inherit" ? !current : current === option.id;
                            const disabled = option.id === "allow" && !grantable;
                            const Icon = option.icon;
                            return (
                              <button
                                key={option.id}
                                type="button"
                                disabled={disabled}
                                title={
                                  disabled
                                    ? "You cannot grant a permission you do not hold yourself."
                                    : option.label
                                }
                                onClick={() =>
                                  setOverrides((previous) => {
                                    const next = { ...previous };
                                    if (option.id === "inherit") delete next[row.key];
                                    else next[row.key] = option.id;
                                    return next;
                                  })
                                }
                                className={cn(
                                  "flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-30",
                                  active
                                    ? option.id === "deny"
                                      ? "bg-red-600 text-white"
                                      : option.id === "allow"
                                        ? "bg-green-600 text-white"
                                        : "bg-gray-700 text-white"
                                    : "bg-white text-gray-500 hover:bg-gray-50"
                                )}
                              >
                                <Icon className="h-3 w-3" />
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>

      {error && <p className="px-5 pb-2 text-sm text-red-600">{error}</p>}

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-3.5">
        <p className="flex items-center gap-1.5 text-xs text-gray-500">
          <Lock className="h-3.5 w-3.5" />
          You can only grant permissions you hold yourself.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button onClick={save} size="sm" disabled={saving || !loaded} type="button">
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="mr-2 h-4 w-4" />
            )}
            Save overrides
          </Button>
        </div>
      </footer>
    </ModalOverlay>
  );
}
