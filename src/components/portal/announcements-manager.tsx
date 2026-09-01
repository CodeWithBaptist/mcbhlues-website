"use client";

import { useState } from "react";
import { Loader2, Megaphone, Pencil, Plus, Power, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Card, EmptyState } from "./ui";

export interface AnnouncementRow {
  id: string;
  title: string;
  body: string;
  tone: string;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

interface EditorState {
  id: string | null;
  title: string;
  body: string;
  tone: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const value = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

function emptyEditor(): EditorState {
  return { id: null, title: "", body: "", tone: "info", startsAt: "", endsAt: "", isActive: true };
}

const TONE_STYLES: Record<string, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-700",
  success: "border-green-200 bg-green-50 text-green-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
};

export function AnnouncementsManager({
  initialAnnouncements,
  canManage,
}: {
  initialAnnouncements: AnnouncementRow[];
  canManage: boolean;
}) {
  const [list, setList] = useState(initialAnnouncements);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);

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
    const data = await call("/api/portal/cms/announcements");
    if (data?.announcements) setList(data.announcements);
  }

  async function toggleActive(row: AnnouncementRow) {
    setBusyId(row.id);
    const data = await call(`/api/portal/cms/announcements/${row.id}`, "PATCH", { isActive: !row.isActive });
    setBusyId(null);
    if (data?.announcement) {
      notify(row.isActive ? "Announcement deactivated." : "Announcement is now live on the website.");
      await refresh();
    }
  }

  async function remove(row: AnnouncementRow) {
    if (!confirm(`Delete “${row.title}”?`)) return;
    setBusyId(row.id);
    const data = await call(`/api/portal/cms/announcements/${row.id}`, "DELETE");
    setBusyId(null);
    if (data?.ok) {
      notify("Announcement deleted.");
      await refresh();
    }
  }

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

      {canManage && (
        <div className="flex justify-end">
          <Button onClick={() => setEditor(emptyEditor())}>
            <Plus className="mr-2 h-4 w-4" />
            New announcement
          </Button>
        </div>
      )}

      <Card title="Announcements" description={`${list.length} total · ${list.filter((row) => row.isActive).length} active`}>
        {list.length === 0 ? (
          <EmptyState title="No announcements" description="Create the first site-wide announcement." />
        ) : (
          <ul className="space-y-3">
            {list.map((row) => (
              <li
                key={row.id}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4",
                  row.isActive ? "border-gray-200 bg-white" : "border-dashed border-gray-200 bg-gray-50/50 opacity-70"
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className={cn("rounded-lg border p-2", TONE_STYLES[row.tone] ?? TONE_STYLES.info)}>
                    <Megaphone className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-dark">{row.title}</p>
                    {row.body && <p className="truncate text-sm text-gray-500">{row.body}</p>}
                    <p className="mt-0.5 text-[11px] text-gray-400">
                      {row.startsAt ? `from ${new Date(row.startsAt).toLocaleString()} ` : ""}
                      {row.endsAt ? `until ${new Date(row.endsAt).toLocaleString()}` : row.startsAt ? "" : "always on while active"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                      row.isActive
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-gray-200 bg-gray-100 text-gray-500"
                    )}
                  >
                    {row.isActive ? "Live" : "Off"}
                  </span>
                  {canManage && (
                    <>
                      <SmallAction title={row.isActive ? "Deactivate" : "Activate"} disabled={busyId !== null} onClick={() => toggleActive(row)}>
                        <Power className="h-3.5 w-3.5" />
                      </SmallAction>
                      <SmallAction
                        title="Edit"
                        disabled={busyId !== null}
                        onClick={() =>
                          setEditor({
                            id: row.id,
                            title: row.title,
                            body: row.body,
                            tone: row.tone,
                            startsAt: toLocalInput(row.startsAt),
                            endsAt: toLocalInput(row.endsAt),
                            isActive: row.isActive,
                          })
                        }
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </SmallAction>
                      <SmallAction danger title="Delete" disabled={busyId !== null} onClick={() => remove(row)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </SmallAction>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {editor && (
        <AnnouncementEditor
          state={editor}
          onClose={() => setEditor(null)}
          onSaved={async (created) => {
            setEditor(null);
            notify(created ? "Announcement created." : "Announcement updated.");
            await refresh();
          }}
        />
      )}
    </div>
  );
}

function SmallAction({
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

function AnnouncementEditor({
  state: initial,
  onClose,
  onSaved,
}: {
  state: EditorState;
  onClose: () => void;
  onSaved: (created: boolean) => void;
}) {
  const [form, setForm] = useState(initial);
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
      title: form.title,
      body: form.body,
      tone: form.tone,
      isActive: form.isActive,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
    };

    const url = isEdit ? `/api/portal/cms/announcements/${form.id}` : "/api/portal/cms/announcements";
    const response = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setError(data.error ?? "Unable to save announcement.");
      return;
    }
    onSaved(!isEdit);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <form onSubmit={submit} className="my-4 w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="font-heading text-base font-bold text-dark">
            {isEdit ? "Edit announcement" : "New announcement"}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">Title</span>
            <Input required value={form.title} onChange={(e) => set("title", e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">Message (optional)</span>
            <Textarea value={form.body} onChange={(e) => set("body", e.target.value)} className="min-h-[90px]" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">Tone</span>
              <select
                className="h-12 w-full rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                value={form.tone}
                onChange={(e) => set("tone", e.target.value)}
              >
                <option value="info">Info (blue)</option>
                <option value="success">Success (green)</option>
                <option value="warning">Warning (amber)</option>
              </select>
            </label>
            <div />
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">Starts at (optional)</span>
              <Input type="datetime-local" value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">Ends at (optional)</span>
              <Input type="datetime-local" value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
            </label>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} />
            Live on the public website
          </label>
        </div>

        {error && <p className="border-t border-red-100 bg-red-50 px-6 py-2 text-sm text-red-700">{error}</p>}

        <footer className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Save changes" : "Create announcement"}
          </Button>
        </footer>
      </form>
    </div>
  );
}
