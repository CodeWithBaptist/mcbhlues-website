"use client";

import { useMemo, useState } from "react";
import { Copy, Download, Mail, MailX, RotateCcw, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { SubscriberRow } from "@/lib/subscribers/subscriber-service";
import { Card, EmptyState, IconAction, Notice, StatusPill } from "./ui";

/**
 * The Newsletter screen: every address that joined the mailing list, newest
 * first, straight from the table the public sign-up writes to.
 *
 * Filtering happens here rather than in the database on purpose — a subscriber
 * list is a few thousand rows at most, so the whole list is already in memory
 * and search stays instant.
 *
 * Two actions are offered because those are the two things a list needs by
 * hand: copying an address into an email client, and taking someone off the
 * list when they ask. Addresses are never deleted — an opt-out is the record
 * that the person asked to be left alone (see `setSubscriberStatus`).
 */
interface SubscribersManagerProps {
  initialSubscribers: SubscriberRow[];
  permissions: string[];
  /** Render timestamp from the server — the "last 30 days" window is measured from it. */
  generatedAt: string;
}

const SOURCE_LABELS: Record<string, string> = {
  website: "Website",
  portal: "Portal",
};

export function SubscribersManager({ initialSubscribers, permissions, generatedAt }: SubscribersManagerProps) {
  const [list, setList] = useState(initialSubscribers);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const canUpdate = permissions.includes("subscriber:update");

  // Derived from the rows on screen rather than a second query, so the numbers
  // above the table always describe the table below it. `generatedAt` is the
  // server render time — "now" is never read during a render.
  const counts = useMemo(() => {
    const cutoff = Date.parse(generatedAt) - 30 * 24 * 60 * 60 * 1000;
    return {
      total: list.length,
      active: list.filter((row) => row.status === "active").length,
      unsubscribed: list.filter((row) => row.status === "unsubscribed").length,
      last30Days: list.filter((row) => Date.parse(row.createdAt) >= cutoff).length,
    };
  }, [list, generatedAt]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return list.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (sourceFilter !== "all" && row.source !== sourceFilter) return false;
      if (!needle) return true;
      const haystack = `${row.email} ${row.customer?.name ?? ""} ${row.source}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [list, search, statusFilter, sourceFilter]);

  async function refresh() {
    try {
      const response = await fetch("/api/portal/subscribers", { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (response.ok && Array.isArray(data?.subscribers)) setList(data.subscribers);
    } catch {
      /* keep the rows already on screen */
    }
  }

  async function setStatus(row: SubscriberRow, status: "active" | "unsubscribed") {
    if (
      status === "unsubscribed" &&
      !confirm(`Take ${row.email} off the mailing list? They will not receive the newsletter.`)
    ) {
      return;
    }

    setBusyId(row.id);
    try {
      const response = await fetch(`/api/portal/subscribers/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage({ tone: "error", text: data?.error ?? "Could not update that address." });
        return;
      }
      setList((previous) =>
        previous.map((entry) => (entry.id === row.id ? { ...entry, ...data.subscriber } : entry))
      );
      setMessage({
        tone: "ok",
        text:
          status === "unsubscribed"
            ? `${row.email} was removed from the list.`
            : `${row.email} is back on the list.`,
      });
    } catch {
      setMessage({ tone: "error", text: "The request failed — check your connection and try again." });
    } finally {
      setBusyId(null);
      await refresh();
    }
  }

  async function copy(email: string, id: string) {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1500);
    } catch {
      setMessage({ tone: "error", text: "Could not access the clipboard." });
    }
  }

  /**
   * Exports exactly what is on screen — the filters are the point of the
   * button, so a "Lekki only" slice can be pasted into an email client without
   * editing a full export first.
   */
  function exportCsv() {
    const header = ["email", "status", "source", "joined", "unsubscribed"];
    const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const rows = filtered.map((row) =>
      [
        row.email,
        row.status,
        row.source,
        new Date(row.createdAt).toISOString(),
        row.unsubscribedAt ? new Date(row.unsubscribedAt).toISOString() : "",
      ]
        .map(escape)
        .join(",")
    );
    const blob = new Blob([[header.join(","), ...rows].join("\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mcbhlues-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      {message && (
        <Notice tone={message.tone} onDismiss={() => setMessage(null)}>
          {message.text}
        </Notice>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SubscriberStat label="Total addresses" value={counts.total} />
        <SubscriberStat label="Active" value={counts.active} tone="text-green-600" />
        <SubscriberStat label="Unsubscribed" value={counts.unsubscribed} tone="text-red-600" />
        <SubscriberStat label="Joined in 30 days" value={counts.last30Days} tone="text-primary" />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder="Search email or customer…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="sm:max-w-xs"
          />
          <SegmentedControl
            scrollable
            options={[
              { label: "All", value: "all" },
              { label: "Active", value: "active" },
              { label: "Unsubscribed", value: "unsubscribed" },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            label="Filter subscribers by status"
          />
          <SegmentedControl
            scrollable
            options={[
              { label: "Any source", value: "all" },
              { label: "Website", value: "website" },
              { label: "Portal", value: "portal" },
            ]}
            value={sourceFilter}
            onChange={setSourceFilter}
            label="Filter subscribers by source"
          />
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={filtered.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card
        title="Mailing list"
        description={`${counts.total} total · ${filtered.length} shown · auto-replies are recorded under System Logs`}
        actions={
          <span className="text-xs text-gray-500">
            New addresses appear here as soon as the homepage form is used.
          </span>
        }
      >
        {filtered.length === 0 ? (
          <EmptyState
            icon={<UserRound className="h-6 w-6" />}
            title={list.length === 0 ? "No subscribers yet" : "No addresses match these filters"}
            description={
              list.length === 0
                ? "Join the list from the homepage hero and the address will be waiting here."
                : "Try a different search or clear the filters."
            }
          />
        ) : (
          <div
            className="portal-table-scroll overflow-x-auto"
            role="region"
            aria-label="Subscribers table"
            tabIndex={0}
          >
            <table
              role="table"
              data-busy={busyId !== null || undefined}
              className="portal-table portal-record-table w-full min-w-[840px] text-left text-sm"
            >
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-xs uppercase tracking-wide text-gray-500">
                  <th scope="col" className="px-3 py-2">Email address</th>
                  <th scope="col" className="px-3 py-2">Status</th>
                  <th scope="col" className="px-3 py-2">Source</th>
                  <th scope="col" className="px-3 py-2">Joined</th>
                  <th scope="col" className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b border-gray-50 align-top">
                    <td data-label="Email address" className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Mail className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-dark">{row.email}</p>
                          {row.customer ? (
                            <p className="truncate text-xs text-gray-500">
                              Known customer · {row.customer.name}
                            </p>
                          ) : row.status === "unsubscribed" && row.unsubscribedAt ? (
                            <p className="truncate text-xs text-gray-400">
                              Removed {new Date(row.unsubscribedAt).toLocaleDateString()}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td data-label="Status" className="px-3 py-3">
                      <StatusPill status={row.status} />
                    </td>
                    <td data-label="Source" className="px-3 py-3 text-xs text-gray-600">
                      {SOURCE_LABELS[row.source] ?? row.source}
                    </td>
                    <td data-label="Joined" className="whitespace-nowrap px-3 py-3 text-xs text-gray-500">
                      {new Date(row.createdAt).toLocaleDateString()}
                    </td>
                    <td data-label="Actions" className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <IconAction
                          title={copiedId === row.id ? "Copied" : "Copy address"}
                          success={copiedId === row.id}
                          onClick={() => copy(row.email, row.id)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </IconAction>
                        {canUpdate &&
                          (row.status === "active" ? (
                            <IconAction
                              danger
                              title="Unsubscribe"
                              disabled={busyId !== null}
                              onClick={() => setStatus(row, "unsubscribed")}
                            >
                              <MailX className="h-3.5 w-3.5" />
                            </IconAction>
                          ) : (
                            <IconAction
                              success
                              title="Add back to the list"
                              disabled={busyId !== null}
                              onClick={() => setStatus(row, "active")}
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </IconAction>
                          ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function SubscriberStat({
  label,
  value,
  tone = "text-dark",
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-0.5 text-xl font-bold ${tone}`}>{value}</p>
    </div>
  );
}
