"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  BellPlus,
  CalendarCheck,
  CheckCheck,
  Info,
  Loader2,
  MessageSquare,
  UserRound,
  Building2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { NotificationRow } from "@/lib/notifications/notification-service";
import { Card, EmptyState } from "./ui";

const KIND_ICONS: Record<string, React.ReactNode> = {
  enquiry: <MessageSquare className="h-4 w-4 text-blue-600" />,
  booking: <CalendarCheck className="h-4 w-4 text-green-600" />,
  customer: <UserRound className="h-4 w-4 text-amber-600" />,
  property: <Building2 className="h-4 w-4 text-primary" />,
  system: <Bell className="h-4 w-4 text-gray-500" />,
  info: <Info className="h-4 w-4 text-gray-500" />,
};

interface NotificationsManagerProps {
  initialNotifications: NotificationRow[];
  canManage: boolean;
  staff: { id: string; firstName: string; lastName: string }[];
}

export function NotificationsManager({
  initialNotifications,
  canManage,
  staff,
}: NotificationsManagerProps) {
  const [list, setList] = useState(initialNotifications);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [composing, setComposing] = useState(false);
  const [busy, setBusy] = useState(false);

  function notify(text: string, tone: "ok" | "error" = "ok") {
    setMessage({ tone, text });
  }

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

  async function markRead(id: string) {
    setList((current) => current.map((row) => (row.id === id ? { ...row, read: true } : row)));
    await post(`/api/portal/notifications/${id}/read`);
  }

  async function markAll() {
    setBusy(true);
    const data = await post("/api/portal/notifications/read-all");
    setBusy(false);
    if (data?.ok) {
      setList((current) => current.map((row) => ({ ...row, read: true })));
      notify("All notifications marked as read.");
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          <span className="font-semibold text-dark">{list.filter((row) => !row.read).length}</span> unread
        </p>
        <div className="flex gap-2">
          {list.some((row) => !row.read) && (
            <Button variant="outline" size="sm" onClick={markAll} disabled={busy}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          )}
          {canManage && (
            <Button size="sm" onClick={() => setComposing(true)}>
              <BellPlus className="mr-2 h-4 w-4" />
              Send notification
            </Button>
          )}
        </div>
      </div>

      <Card title="Your feed" description="Newest first — workflow events arrive here in real time as staff work.">
        {list.length === 0 ? (
          <EmptyState title="Nothing yet" description="Enquiry and booking events will appear here." />
        ) : (
          <ul className="divide-y divide-gray-50">
            {list.map((row) => {
              const content = (
                <div className="flex items-start gap-3 py-3">
                  <span
                    className={cn(
                      "mt-0.5 rounded-lg border p-2",
                      row.read ? "border-gray-100 bg-gray-50" : "border-primary/20 bg-primary/5"
                    )}
                  >
                    {KIND_ICONS[row.kind] ?? KIND_ICONS.info}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm", row.read ? "text-gray-600" : "font-semibold text-dark")}>
                      {row.title}
                    </p>
                    {row.body && <p className="mt-0.5 truncate text-xs text-gray-500">{row.body}</p>}
                    <p className="mt-0.5 text-[11px] text-gray-400">
                      {row.userId ? "To you" : "Broadcast"} · {new Date(row.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!row.read && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        void markRead(row.id);
                      }}
                      className="shrink-0 rounded border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:border-primary hover:text-primary"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              );
              return (
                <li key={row.id}>
                  {row.link ? (
                    <Link
                      href={row.link}
                      onClick={() => !row.read && void markRead(row.id)}
                      className="block rounded-lg transition-colors hover:bg-gray-50"
                    >
                      {content}
                    </Link>
                  ) : (
                    content
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {composing && (
        <ComposeDialog
          staff={staff}
          onClose={() => setComposing(false)}
          onSent={(broadcast) => {
            setComposing(false);
            notify(broadcast ? "Broadcast sent to the whole team." : "Notification sent.");
          }}
          onError={(text) => notify(text, "error")}
        />
      )}
    </div>
  );
}

function ComposeDialog({
  staff,
  onClose,
  onSent,
  onError,
}: {
  staff: { id: string; firstName: string; lastName: string }[];
  onClose: () => void;
  onSent: (broadcast: boolean) => void;
  onError: (text: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState("info");
  const [link, setLink] = useState("");
  const [userId, setUserId] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    const response = await fetch("/api/portal/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, body, kind, link, userId: userId || null }),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      onError(data.error ?? "Unable to send the notification.");
      return;
    }
    onSent(!userId);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="font-heading text-base font-bold text-dark">Send notification</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-4 px-6 py-5">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">Title</span>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Staff meeting at 3 PM" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">Message</span>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} className="min-h-[80px]" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">Kind</span>
              <select
                className="h-12 w-full rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
              >
                <option value="info">Info</option>
                <option value="system">System</option>
                <option value="enquiry">Enquiry</option>
                <option value="booking">Booking</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">Recipient</span>
              <select
                className="h-12 w-full rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
              >
                <option value="">Everyone (broadcast)</option>
                {staff.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.firstName} {member.lastName}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">Link (optional)</span>
            <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="/portal/bookings" />
          </label>
        </div>

        <footer className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send
          </Button>
        </footer>
      </form>
    </div>
  );
}
