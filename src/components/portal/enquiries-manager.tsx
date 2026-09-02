"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  Loader2,
  Mail,
  MessageSquare,
  Pencil,
  Plus,
  Reply,
  Send,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { EnquiryDetail, EnquiryListItem } from "@/lib/enquiries/enquiry-service";
import { Card, EmptyState } from "./ui";

export interface StaffOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface EnquiriesManagerProps {
  initialEnquiries: EnquiryListItem[];
  staff: StaffOption[];
  propertyOptions: { id: string; title: string; city: string }[];
  canAssign: boolean;
  permissions: string[];
  currentUserId: string;
}

interface EditorState {
  id: string | null;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  type: string;
  source: string;
  priority: string;
  propertyId: string;
  assignedTo: string;
}

function emptyEditor(): EditorState {
  return {
    id: null,
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    type: "general",
    source: "portal",
    priority: "normal",
    propertyId: "",
    assignedTo: "",
  };
}

function fromEnquiry(enquiry: EnquiryListItem): EditorState {
  return {
    id: enquiry.id,
    name: enquiry.name,
    email: enquiry.email,
    phone: enquiry.phone,
    subject: enquiry.subject,
    message: enquiry.message,
    type: enquiry.type,
    source: enquiry.source,
    priority: enquiry.priority,
    propertyId: enquiry.propertyId ?? "",
    assignedTo: enquiry.assignedTo ?? "",
  };
}

const STATUS_STYLES: Record<string, string> = {
  new: "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  responded: "bg-green-50 text-green-700 border-green-200",
  closed: "bg-gray-100 text-gray-500 border-gray-200",
};

export function EnquiriesManager({
  initialEnquiries,
  staff,
  propertyOptions,
  canAssign,
  permissions,
  currentUserId,
}: EnquiriesManagerProps) {
  const [list, setList] = useState(initialEnquiries);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [detail, setDetail] = useState<EnquiryDetail | null>(null);

  const canCreate = permissions.includes("enquiry:create");
  const canEdit = permissions.includes("enquiry:update");
  const canDelete = permissions.includes("enquiry:delete");
  const canRespond = permissions.includes("enquiry:respond");
  const canStatus = permissions.includes("enquiry:status_update");
  const canNotes = permissions.includes("enquiry:notes");

  const filtered = useMemo(
    () =>
      list.filter((enquiry) => {
        const haystack =
          `${enquiry.reference} ${enquiry.name} ${enquiry.email} ${enquiry.subject} ${enquiry.message}`.toLowerCase();
        const matchesSearch = haystack.includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" || enquiry.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [list, search, statusFilter]
  );

  function notify(text: string, tone: "ok" | "error" = "ok") {
    setMessage({ tone, text });
  }

  async function call(url: string, method = "GET", body?: unknown) {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      notify(data.error ?? "Request failed.", "error");
      return null;
    }
    return data;
  }

  async function refresh() {
    const data = await call("/api/portal/enquiries");
    if (data?.enquiries) setList(data.enquiries);
  }

  async function openDetail(enquiry: EnquiryListItem) {
    const data = await call(`/api/portal/enquiries/${enquiry.id}`);
    if (data?.enquiry) setDetail(data.enquiry);
  }

  async function changeStatus(enquiry: EnquiryListItem, status: string) {
    setBusyId(enquiry.id);
    const data = await call(`/api/portal/enquiries/${enquiry.id}/status`, "POST", { status });
    setBusyId(null);
    if (data?.enquiry) {
      notify(`Enquiry marked ${status.replace(/_/g, " ")}.`);
      await refresh();
      if (detail?.id === enquiry.id) await openDetail(enquiry);
    }
  }

  async function remove(enquiry: EnquiryListItem) {
    if (!confirm(`Delete enquiry ${enquiry.reference}? This cannot be undone.`)) return;
    setBusyId(enquiry.id);
    const data = await call(`/api/portal/enquiries/${enquiry.id}`, "DELETE");
    setBusyId(null);
    if (data?.ok) {
      notify("Enquiry deleted.");
      if (detail?.id === enquiry.id) setDetail(null);
      await refresh();
    }
  }

  const newCount = list.filter((enquiry) => enquiry.status === "new").length;

  return (
    <div className="space-y-5">
      {message && (
        <p
          className={cn(
            "rounded-md border px-3 py-2 text-sm",
            message.tone === "ok"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          )}
        >
          {message.text}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder="Search reference, name, subject..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="sm:max-w-xs"
          />
          <div className="flex flex-wrap rounded-lg bg-gray-100 p-1">
            {[
              { label: "All", value: "all" },
              { label: `New${newCount ? ` (${newCount})` : ""}`, value: "new" },
              { label: "In progress", value: "in_progress" },
              { label: "Responded", value: "responded" },
              { label: "Closed", value: "closed" },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatusFilter(option.value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                  statusFilter === option.value
                    ? "bg-white text-primary shadow-sm"
                    : "text-gray-500 hover:text-dark"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        {canCreate && (
          <Button onClick={() => setEditor(emptyEditor())}>
            <Plus className="mr-2 h-4 w-4" />
            Log enquiry
          </Button>
        )}
      </div>

      <Card title="Enquiries" description={`${list.length} total · ${filtered.length} shown · ${newCount} awaiting a first response`}>
        {filtered.length === 0 ? (
          <EmptyState
            title="No enquiries found"
            description={
              list.length === 0
                ? "Website enquiries land here automatically — or log one manually."
                : "Try adjusting your search or filters."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1060px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2">Enquiry</th>
                  <th className="px-3 py-2">Contact</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Property</th>
                  <th className="px-3 py-2">Assigned</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((enquiry) => (
                  <tr key={enquiry.id} className="border-b border-gray-50 align-top">
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => openDetail(enquiry)}
                        className="text-left font-semibold text-dark hover:text-primary"
                      >
                        {enquiry.subject || "No subject"}
                      </button>
                      <p className="mt-0.5 max-w-xs truncate text-xs text-gray-500">{enquiry.message}</p>
                      <p className="mt-0.5 text-[11px] text-gray-400">
                        {enquiry.reference} · {new Date(enquiry.createdAt).toLocaleString()}
                        {enquiry.priority === "high" && (
                          <span className="ml-2 rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                            HIGH PRIORITY
                          </span>
                        )}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-600">
                      <p className="font-medium text-gray-700">{enquiry.name}</p>
                      {enquiry.email && <p>{enquiry.email}</p>}
                      {enquiry.phone && <p className="text-gray-400">{enquiry.phone}</p>}
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">
                        {enquiry.type}
                      </span>
                      <p className="mt-1 text-[11px] text-gray-400">{enquiry.source}</p>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-600">
                      {enquiry.propertyTitle ? (
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-gray-400" />
                          <span className="max-w-[140px] truncate">{enquiry.propertyTitle}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-600">
                      {enquiry.assignedName ?? <span className="text-gray-400">Unassigned</span>}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          STATUS_STYLES[enquiry.status] ?? "bg-gray-100 text-gray-600 border-gray-200"
                        )}
                      >
                        {enquiry.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <IconAction title="Open thread" disabled={busyId !== null} onClick={() => openDetail(enquiry)}>
                          <MessageSquare className="h-3.5 w-3.5" />
                        </IconAction>
                        {canEdit && (
                          <IconAction title="Edit" disabled={busyId !== null} onClick={() => setEditor(fromEnquiry(enquiry))}>
                            <Pencil className="h-3.5 w-3.5" />
                          </IconAction>
                        )}
                        {canStatus && enquiry.status !== "closed" && (
                          <IconAction title="Close enquiry" disabled={busyId !== null} onClick={() => changeStatus(enquiry, "closed")}>
                            <X className="h-3.5 w-3.5" />
                          </IconAction>
                        )}
                        {canDelete && (
                          <IconAction danger title="Delete" disabled={busyId !== null} onClick={() => remove(enquiry)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </IconAction>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editor && (
        <EnquiryEditor
          state={editor}
          propertyOptions={propertyOptions}
          staff={staff}
          canAssign={canAssign}
          onClose={() => setEditor(null)}
          onSaved={async (createdId) => {
            setEditor(null);
            notify(createdId ? "Enquiry logged." : "Enquiry updated.");
            await refresh();
          }}
        />
      )}

      {detail && (
        <EnquiryDetailPanel
          detail={detail}
          staff={staff}
          canAssign={canAssign}
          canRespond={canRespond}
          canStatus={canStatus}
          canNotes={canNotes}
          currentUserId={currentUserId}
          onClose={() => setDetail(null)}
          onChanged={async () => {
            await refresh();
            const data = await call(`/api/portal/enquiries/${detail.id}`);
            if (data?.enquiry) setDetail(data.enquiry);
          }}
          notify={notify}
        />
      )}
    </div>
  );
}

function IconAction({
  children,
  title,
  danger,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded border p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        danger
          ? "border-red-200 text-red-600 hover:bg-red-50"
          : "border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
      )}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Enquiry editor                                                             */
/* -------------------------------------------------------------------------- */

function EnquiryEditor({
  state: initial,
  propertyOptions,
  staff,
  canAssign,
  onClose,
  onSaved,
}: {
  state: EditorState;
  propertyOptions: { id: string; title: string; city: string }[];
  staff: StaffOption[];
  canAssign: boolean;
  onClose: () => void;
  onSaved: (createdId?: string) => void;
}) {
  const [form, setForm] = useState<EditorState>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdit = Boolean(form.id);
  const set = <K extends keyof EditorState>(key: K, value: EditorState[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      subject: form.subject,
      message: form.message,
      type: form.type,
      source: form.source,
      priority: form.priority,
      propertyId: form.propertyId || null,
      assignedTo: form.assignedTo || null,
    };

    const url = isEdit ? `/api/portal/enquiries/${form.id}` : "/api/portal/enquiries";
    const response = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setError(data.error ?? "Unable to save enquiry.");
      return;
    }
    onSaved(isEdit ? undefined : data.enquiry?.id);
  }

  const inputClass =
    "h-12 w-full rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <form onSubmit={submit} className="my-4 w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="font-heading text-base font-bold text-dark">
              {isEdit ? "Edit enquiry" : "Log enquiry"}
            </h2>
            <p className="text-xs text-gray-500">
              {isEdit ? form.subject || form.name : "Record a phone, walk-in or referral enquiry"}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact name">
              <Input required value={form.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Type">
              <select className={inputClass} value={form.type} onChange={(e) => set("type", e.target.value)}>
                <option value="general">General</option>
                <option value="property">Property</option>
                <option value="viewing">Viewing request</option>
              </select>
            </Field>
            <Field label="Priority">
              <select className={inputClass} value={form.priority} onChange={(e) => set("priority", e.target.value)}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </Field>
            <Field label="Source">
              <select className={inputClass} value={form.source} onChange={(e) => set("source", e.target.value)}>
                <option value="portal">Logged by staff</option>
                <option value="website">Website</option>
                <option value="phone">Phone call</option>
                <option value="walk-in">Walk-in</option>
              </select>
            </Field>
            <Field label="Related property" className="sm:col-span-2">
              <select className={inputClass} value={form.propertyId} onChange={(e) => set("propertyId", e.target.value)}>
                <option value="">None</option>
                {propertyOptions.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.title} {property.city ? `· ${property.city}` : ""}
                  </option>
                ))}
              </select>
            </Field>
            {canAssign && (
              <Field label="Assign to" className="sm:col-span-2">
                <select className={inputClass} value={form.assignedTo} onChange={(e) => set("assignedTo", e.target.value)}>
                  <option value="">Unassigned</option>
                  {staff.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.firstName} {member.lastName}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Subject" className="sm:col-span-2">
              <Input value={form.subject} onChange={(e) => set("subject", e.target.value)} />
            </Field>
            <Field label="Message" className="sm:col-span-2">
              <Textarea value={form.message} onChange={(e) => set("message", e.target.value)} className="min-h-[110px]" />
            </Field>
          </div>
        </div>

        {error && <p className="border-t border-red-100 bg-red-50 px-6 py-2 text-sm text-red-700">{error}</p>}

        <footer className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Save changes" : "Log enquiry"}
          </Button>
        </footer>
      </form>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Enquiry thread drawer                                                      */
/* -------------------------------------------------------------------------- */

function EnquiryDetailPanel({
  detail,
  staff,
  canAssign,
  canRespond,
  canStatus,
  canNotes,
  currentUserId,
  onClose,
  onChanged,
  notify,
}: {
  detail: EnquiryDetail;
  staff: StaffOption[];
  canAssign: boolean;
  canRespond: boolean;
  canStatus: boolean;
  canNotes: boolean;
  currentUserId: string;
  onClose: () => void;
  onChanged: () => Promise<void>;
  notify: (text: string, tone?: "ok" | "error") => void;
}) {
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function post(url: string, body?: unknown) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      notify(data.error ?? "Request failed.", "error");
      return null;
    }
    return data;
  }

  async function respond() {
    if (!reply.trim()) return;
    setSaving(true);
    const data = await post(`/api/portal/enquiries/${detail.id}/respond`, { message: reply });
    setSaving(false);
    if (data?.enquiry) {
      setReply("");
      const emailStatus: string | undefined = data.email?.status;
      if (emailStatus === "sent") {
        notify(`Response emailed to ${detail.name} (${detail.email}).`);
      } else if (emailStatus === "queued") {
        notify(
          "Response recorded, but the email was NOT delivered — no mail server is configured yet. Add SMTP details under System Settings → Email delivery.",
          "error"
        );
      } else if (emailStatus === "failed") {
        notify(
          `Response recorded, but the email failed to send${data.email?.error ? `: ${data.email.error}` : "."} Check System Settings → Email delivery.`,
          "error"
        );
      } else {
        notify("Response recorded — this customer left no email address, so follow up by phone.");
      }
      await onChanged();
    }
  }

  async function addNote() {
    if (!note.trim()) return;
    setSaving(true);
    const data = await post(`/api/portal/enquiries/${detail.id}/notes`, { body: note });
    setSaving(false);
    if (data?.note) {
      setNote("");
      notify("Note added.");
      await onChanged();
    }
  }

  async function assign(userId: string) {
    const data = await post(`/api/portal/enquiries/${detail.id}/assign`, { userId: userId || null });
    if (data?.enquiry) {
      notify(userId ? "Enquiry assigned." : "Assignment cleared.");
      await onChanged();
    }
  }

  async function setStatus(status: string) {
    const data = await post(`/api/portal/enquiries/${detail.id}/status`, { status });
    if (data?.enquiry) {
      notify(`Enquiry marked ${status.replace(/_/g, " ")}.`);
      await onChanged();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div>
            <h2 className="font-heading text-base font-bold text-dark">
              {detail.subject || "Enquiry"}
            </h2>
            <p className="text-xs text-gray-500">
              {detail.reference} · {detail.type} · {new Date(detail.createdAt).toLocaleString()}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-6 px-6 py-5">
          {/* Meta */}
          <section className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
              <p className="text-[11px] uppercase text-gray-400">From</p>
              <p className="font-medium text-gray-800">{detail.name}</p>
              {detail.email && (
                <p className="flex items-center gap-1 text-xs text-gray-500">
                  <Mail className="h-3 w-3" />
                  {detail.email}
                </p>
              )}
              {detail.phone && <p className="text-xs text-gray-500">{detail.phone}</p>}
            </div>
            <div className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
              <p className="text-[11px] uppercase text-gray-400">Handling</p>
              <p className="font-medium text-gray-800">{detail.assignedName ?? "Unassigned"}</p>
              <p className="text-xs capitalize text-gray-500">
                {detail.status.replace(/_/g, " ")} · {detail.priority} priority
              </p>
            </div>
          </section>

          {detail.propertyTitle && (
            <p className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-gray-700">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              Regarding property: <span className="font-semibold">{detail.propertyTitle}</span>
            </p>
          )}

          {/* Original message */}
          <section>
            <h3 className="mb-2 text-sm font-bold text-dark">Original message</h3>
            <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              {detail.message || "No message recorded."}
            </div>
          </section>

          {/* Thread */}
          <section>
            <h3 className="mb-2 text-sm font-bold text-dark">Thread ({detail.thread.length})</h3>
            <ul className="space-y-2">
              {detail.thread.map((entry) => (
                <li
                  key={entry.id}
                  className={cn(
                    "rounded-lg border px-4 py-3 text-sm",
                    entry.kind === "response"
                      ? "border-green-100 bg-green-50/60"
                      : "border-gray-100 bg-gray-50"
                  )}
                >
                  <p className="text-gray-700">{entry.body}</p>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-gray-400">
                    {entry.kind === "response" ? (
                      <Reply className="h-3 w-3 text-green-600" />
                    ) : (
                      <StickyNote className="h-3 w-3" />
                    )}
                    {entry.kind === "response" ? "Response to customer" : "Internal note"} · {entry.userEmail} ·{" "}
                    {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
              {detail.thread.length === 0 && (
                <p className="text-xs text-gray-400">No notes or responses yet.</p>
              )}
            </ul>
          </section>

          {/* Respond */}
          {canRespond && detail.status !== "closed" && (
            <section className="rounded-lg border border-green-100 bg-green-50/40 p-4">
              <h3 className="mb-1 flex items-center gap-2 text-sm font-bold text-dark">
                <Send className="h-4 w-4 text-green-700" /> Respond to customer
              </h3>
              <p className="mb-2 text-[11px] text-gray-500">
                {detail.email ? (
                  <>
                    Your reply will be emailed to <span className="font-semibold">{detail.email}</span> and
                    kept on this thread.
                  </>
                ) : (
                  <>No email address on record — the reply is logged here; follow up by phone.</>
                )}
              </p>
              <Textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder={`Reply to ${detail.name}...`}
                className="min-h-[100px] bg-white"
              />
              <Button size="sm" className="mt-2" onClick={respond} disabled={saving || !reply.trim()}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send response
              </Button>
            </section>
          )}

          {/* Internal note */}
          {canNotes && (
            <section className="rounded-lg border border-gray-100 bg-gray-50/60 p-4">
              <h3 className="mb-2 text-sm font-bold text-dark">Add internal note</h3>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Visible to staff only..."
                className="min-h-[80px] bg-white"
              />
              <Button size="sm" variant="outline" className="mt-2" onClick={addNote} disabled={saving || !note.trim()}>
                Add note
              </Button>
            </section>
          )}

          {/* Workflow */}
          <section className="flex flex-wrap items-end gap-3 border-t border-gray-100 pt-4">
            {canAssign && (
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-gray-500">Assign to</span>
                <select
                  className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm"
                  value={detail.assignedTo ?? ""}
                  onChange={(e) => assign(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {staff.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.firstName} {member.lastName}
                      {member.id === currentUserId ? " (me)" : ""}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {canStatus && (
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-gray-500">Status</span>
                <select
                  className="h-10 rounded-md border border-gray-200 bg-white px-3 text-sm"
                  value={detail.status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="new">New</option>
                  <option value="in_progress">In progress</option>
                  <option value="responded">Responded</option>
                  <option value="closed">Closed</option>
                </select>
              </label>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}
