"use client";

import { useMemo, useState } from "react";
import {
  Ban,
  Building2,
  CalendarClock,
  CalendarPlus,
  Check,
  Clock,
  Loader2,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { BookingListItem } from "@/lib/bookings/booking-service";
import { Card, EmptyState } from "./ui";

export interface StaffOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface BookingsManagerProps {
  initialBookings: BookingListItem[];
  staff: StaffOption[];
  propertyOptions: { id: string; title: string; city: string }[];
  customers: { id: string; name: string }[];
  canAssign: boolean;
  permissions: string[];
}

interface EditorState {
  id: string | null;
  name: string;
  email: string;
  phone: string;
  type: string;
  propertyId: string;
  customerId: string;
  assignedTo: string;
  date: string;
  time: string;
  durationMinutes: string;
  location: string;
  notes: string;
}

function toLocalDateTime(iso: string): { date: string; time: string } {
  const value = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    date: `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`,
    time: `${pad(value.getHours())}:${pad(value.getMinutes())}`,
  };
}

function combineDateTime(date: string, time: string): string | null {
  if (!date) return null;
  const combined = new Date(`${date}T${time || "09:00"}`);
  return Number.isNaN(combined.getTime()) ? null : combined.toISOString();
}

function emptyEditor(): EditorState {
  return { id: null, name: "", email: "", phone: "", type: "viewing", propertyId: "", customerId: "", assignedTo: "", date: "", time: "", durationMinutes: "60", location: "", notes: "" };
}

function fromBooking(booking: BookingListItem): EditorState {
  const { date, time } = toLocalDateTime(booking.scheduledAt);
  return {
    id: booking.id,
    name: booking.name,
    email: booking.email,
    phone: booking.phone,
    type: booking.type,
    propertyId: booking.propertyId ?? "",
    customerId: booking.customerId ?? "",
    assignedTo: booking.assignedTo ?? "",
    date,
    time,
    durationMinutes: String(booking.durationMinutes),
    location: booking.location,
    notes: booking.notes,
  };
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-green-50 text-green-700 border-green-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

export function BookingsManager({
  initialBookings,
  staff,
  propertyOptions,
  customers,
  canAssign,
  permissions,
}: BookingsManagerProps) {
  const [list, setList] = useState(initialBookings);
  // Stable "now" for overdue detection — captured once when the list mounts.
  const [now] = useState(() => Date.now());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [rescheduling, setRescheduling] = useState<BookingListItem | null>(null);

  const canCreate = permissions.includes("booking:create");
  const canEdit = permissions.includes("booking:update");
  const canDelete = permissions.includes("booking:delete");
  const canApprove = permissions.includes("booking:approve");
  const canReject = permissions.includes("booking:reject");
  const canReschedule = permissions.includes("booking:reschedule");
  const canStatus = permissions.includes("booking:status_update");

  const filtered = useMemo(
    () =>
      list.filter((booking) => {
        const haystack =
          `${booking.reference} ${booking.name} ${booking.email} ${booking.propertyTitle ?? ""}`.toLowerCase();
        const matchesSearch = haystack.includes(search.toLowerCase());
        const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
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
    const data = await call("/api/portal/bookings");
    if (data?.bookings) setList(data.bookings);
  }

  async function transition(booking: BookingListItem, status: string, label: string) {
    setBusyId(booking.id);
    const data = await call(`/api/portal/bookings/${booking.id}/status`, "POST", { status });
    setBusyId(null);
    if (data?.booking) {
      notify(`Booking ${booking.reference} ${label}.`);
      await refresh();
    }
  }

  async function remove(booking: BookingListItem) {
    if (!confirm(`Delete booking ${booking.reference}? This cannot be undone.`)) return;
    setBusyId(booking.id);
    const data = await call(`/api/portal/bookings/${booking.id}`, "DELETE");
    setBusyId(null);
    if (data?.ok) {
      notify("Booking deleted.");
      await refresh();
    }
  }

  const propertyTitle = (id: string | null) => propertyOptions.find((row) => row.id === id)?.title;

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
            placeholder="Search reference, name, property..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="sm:max-w-xs"
          />
          <div className="flex flex-wrap rounded-lg bg-gray-100 p-1">
            {["all", "pending", "confirmed", "completed", "cancelled", "rejected"].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setStatusFilter(value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                  statusFilter === value ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-dark"
                )}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
        {canCreate && (
          <Button onClick={() => setEditor(emptyEditor())}>
            <CalendarPlus className="mr-2 h-4 w-4" />
            New booking
          </Button>
        )}
      </div>

      <Card
        title="Bookings"
        description={`${list.length} total · ${filtered.length} shown · ${list.filter((b) => b.status === "pending").length} awaiting confirmation`}
      >
        {filtered.length === 0 ? (
          <EmptyState
            title="No bookings found"
            description={list.length === 0 ? "Create the first viewing or consultation." : "Try adjusting your search or filters."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2">Schedule</th>
                  <th className="px-3 py-2">Guest</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Property</th>
                  <th className="px-3 py-2">Assigned</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((booking) => {
                  const when = new Date(booking.scheduledAt);
                  const overdue = when.getTime() < now && booking.status === "pending";
                  return (
                    <tr key={booking.id} className="border-b border-gray-50 align-top">
                      <td className="px-3 py-3">
                        <p className="font-semibold text-dark">{when.toLocaleDateString()}</p>
                        <p className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {when.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · {booking.durationMinutes} min
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {booking.reference}
                          {overdue && <span className="ml-1 text-amber-600">(overdue)</span>}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-600">
                        <p className="font-medium text-gray-700">{booking.name}</p>
                        {booking.email && <p>{booking.email}</p>}
                        {booking.phone && <p className="text-gray-400">{booking.phone}</p>}
                      </td>
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">
                          {booking.type}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-600">
                        {booking.propertyTitle || propertyTitle(booking.propertyId) ? (
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-gray-400" />
                            <span className="max-w-[150px] truncate">{booking.propertyTitle ?? propertyTitle(booking.propertyId)}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400">{booking.location || "—"}</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-600">
                        {booking.assignedName ?? <span className="text-gray-400">Unassigned</span>}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={cn(
                            "rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
                            STATUS_STYLES[booking.status] ?? "bg-gray-100 text-gray-600 border-gray-200"
                          )}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {canApprove && booking.status === "pending" && (
                            <IconAction success title="Confirm booking" disabled={busyId !== null} onClick={() => transition(booking, "confirmed", "confirmed")}>
                              <Check className="h-3.5 w-3.5" />
                            </IconAction>
                          )}
                          {canReject && (booking.status === "pending" || booking.status === "confirmed") && (
                            <IconAction danger title="Reject booking" disabled={busyId !== null} onClick={() => transition(booking, "rejected", "rejected")}>
                              <Ban className="h-3.5 w-3.5" />
                            </IconAction>
                          )}
                          {canReschedule && !["completed", "cancelled", "rejected"].includes(booking.status) && (
                            <IconAction title="Reschedule" disabled={busyId !== null} onClick={() => setRescheduling(booking)}>
                              <CalendarClock className="h-3.5 w-3.5" />
                            </IconAction>
                          )}
                          {canStatus && booking.status === "confirmed" && (
                            <IconAction success title="Mark completed" disabled={busyId !== null} onClick={() => transition(booking, "completed", "completed")}>
                              <Check className="h-3.5 w-3.5" />
                            </IconAction>
                          )}
                          {canStatus && !["completed", "cancelled", "rejected"].includes(booking.status) && (
                            <IconAction title="Cancel booking" disabled={busyId !== null} onClick={() => transition(booking, "cancelled", "cancelled")}>
                              <X className="h-3.5 w-3.5" />
                            </IconAction>
                          )}
                          {canEdit && (
                            <IconAction title="Edit" disabled={busyId !== null} onClick={() => setEditor(fromBooking(booking))}>
                              <Pencil className="h-3.5 w-3.5" />
                            </IconAction>
                          )}
                          {canDelete && (
                            <IconAction danger title="Delete" disabled={busyId !== null} onClick={() => remove(booking)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </IconAction>
                          )}
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

      {editor && (
        <BookingEditor
          state={editor}
          propertyOptions={propertyOptions}
          customers={customers}
          staff={staff}
          canAssign={canAssign}
          onClose={() => setEditor(null)}
          onSaved={async (createdId) => {
            setEditor(null);
            notify(createdId ? "Booking created." : "Booking updated.");
            await refresh();
          }}
        />
      )}

      {rescheduling && (
        <RescheduleDialog
          booking={rescheduling}
          onClose={() => setRescheduling(null)}
          onSaved={async () => {
            setRescheduling(null);
            notify(`Booking ${rescheduling.reference} rescheduled.`);
            await refresh();
          }}
        />
      )}
    </div>
  );
}

function IconAction({
  children,
  title,
  danger,
  success,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  danger?: boolean;
  success?: boolean;
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
          : success
            ? "border-green-200 text-green-700 hover:bg-green-50"
            : "border-gray-200 text-gray-600 hover:border-primary hover:text-primary"
      )}
    >
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Booking editor                                                             */
/* -------------------------------------------------------------------------- */

function BookingEditor({
  state: initial,
  propertyOptions,
  customers,
  staff,
  canAssign,
  onClose,
  onSaved,
}: {
  state: EditorState;
  propertyOptions: { id: string; title: string; city: string }[];
  customers: { id: string; name: string }[];
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
    const scheduledAt = combineDateTime(form.date, form.time);
    if (!scheduledAt) {
      setError("Please choose a valid date and time.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      type: form.type,
      propertyId: form.propertyId || null,
      customerId: form.customerId || null,
      assignedTo: form.assignedTo || null,
      scheduledAt,
      durationMinutes: Number(form.durationMinutes) || 60,
      location: form.location,
      notes: form.notes,
    };

    const url = isEdit ? `/api/portal/bookings/${form.id}` : "/api/portal/bookings";
    const response = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setError(data.error ?? "Unable to save booking.");
      return;
    }
    onSaved(isEdit ? undefined : data.booking?.id);
  }

  const inputClass =
    "h-12 w-full rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <form onSubmit={submit} className="my-4 w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="font-heading text-base font-bold text-dark">
              {isEdit ? "Edit booking" : "New booking"}
            </h2>
            <p className="text-xs text-gray-500">
              {isEdit ? form.name : "Schedule a viewing, consultation or inspection"}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Guest name">
              <Input required value={form.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Type">
              <select className={inputClass} value={form.type} onChange={(e) => set("type", e.target.value)}>
                <option value="viewing">Property viewing</option>
                <option value="consultation">Consultation</option>
                <option value="inspection">Inspection</option>
              </select>
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Date">
              <Input required type="date" value={form.date} onChange={(e) => set("date", e.target.value)} />
            </Field>
            <Field label="Time">
              <Input required type="time" value={form.time} onChange={(e) => set("time", e.target.value)} />
            </Field>
            <Field label="Duration (minutes)">
              <Input type="number" min={15} step={15} value={form.durationMinutes} onChange={(e) => set("durationMinutes", e.target.value)} />
            </Field>
            <Field label="Location">
              <Input value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="On-site / office / video call" />
            </Field>
            <Field label="Property">
              <select className={inputClass} value={form.propertyId} onChange={(e) => set("propertyId", e.target.value)}>
                <option value="">No property</option>
                {propertyOptions.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.title} {property.city ? `· ${property.city}` : ""}
                  </option>
                ))}
              </select>
            </Field>
            {customers.length > 0 && (
              <Field label="Linked customer">
                <select className={inputClass} value={form.customerId} onChange={(e) => set("customerId", e.target.value)}>
                  <option value="">None</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            {canAssign && (
              <Field label="Assigned staff">
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
            <Field label="Notes" className="sm:col-span-2">
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Gate codes, parking instructions, access notes..." />
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
            {isEdit ? "Save changes" : "Create booking"}
          </Button>
        </footer>
      </form>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Reschedule dialog                                                          */
/* -------------------------------------------------------------------------- */

function RescheduleDialog({
  booking,
  onClose,
  onSaved,
}: {
  booking: BookingListItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const initial = toLocalDateTime(booking.scheduledAt);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const scheduledAt = combineDateTime(date, time);
    if (!scheduledAt) {
      setError("Please choose a valid date and time.");
      return;
    }
    setSaving(true);
    setError(null);
    const response = await fetch(`/api/portal/bookings/${booking.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt }),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setError(data.error ?? "Unable to reschedule.");
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="font-heading text-base font-bold text-dark">Reschedule {booking.reference}</h2>
        <p className="mb-4 text-xs text-gray-500">
          Currently {new Date(booking.scheduledAt).toLocaleString()}
        </p>
        <div className="space-y-3">
          <Field label="New date">
            <Input required type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="New time">
            <Input required type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </Field>
        </div>
        {error && <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      </form>
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
