"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  Building2,
  CalendarCheck,
  Heart,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { CustomerDetail, CustomerListItem } from "@/lib/customers/customer-service";
import { Card, EmptyState, StatusPill } from "./ui";

export interface StaffOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface CustomersManagerProps {
  initialCustomers: CustomerListItem[];
  staff: StaffOption[];
  propertyOptions: { id: string; title: string; city: string }[];
  permissions: string[];
}

interface EditorState {
  id: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  type: string;
  status: string;
  source: string;
  budgetMin: string;
  budgetMax: string;
  preferredLocation: string;
  notes: string;
  assignedTo: string;
}

function emptyEditor(): EditorState {
  return {
    id: null,
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    type: "buyer",
    status: "active",
    source: "",
    budgetMin: "",
    budgetMax: "",
    preferredLocation: "",
    notes: "",
    assignedTo: "",
  };
}

function fromCustomer(customer: CustomerListItem): EditorState {
  return {
    id: customer.id,
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email,
    phone: customer.phone,
    type: customer.type,
    status: customer.status,
    source: customer.source,
    budgetMin: customer.budgetMin ? String(customer.budgetMin) : "",
    budgetMax: customer.budgetMax ? String(customer.budgetMax) : "",
    preferredLocation: customer.preferredLocation,
    notes: customer.notes,
    assignedTo: customer.assignedTo ?? "",
  };
}

export function CustomersManager({ initialCustomers, staff, propertyOptions, permissions }: CustomersManagerProps) {
  const [list, setList] = useState(initialCustomers);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const canCreate = permissions.includes("customer:create");
  const canEdit = permissions.includes("customer:update");
  const canDelete = permissions.includes("customer:delete");
  const canNotes = permissions.includes("customer:notes");
  const canSeeEnquiries = permissions.includes("customer:enquiries_read");
  const canSeeBookings = permissions.includes("customer:bookings_read");
  const canSeeSaved = permissions.includes("customer:saved_read");

  const filtered = useMemo(
    () =>
      list.filter((customer) => {
        const haystack =
          `${customer.firstName} ${customer.lastName} ${customer.email} ${customer.phone} ${customer.preferredLocation}`.toLowerCase();
        const matchesSearch = haystack.includes(search.toLowerCase());
        const matchesType = typeFilter === "all" || customer.type === typeFilter;
        return matchesSearch && matchesType;
      }),
    [list, search, typeFilter]
  );

  function notify(text: string, tone: "ok" | "error" = "ok") {
    setMessage({ tone, text });
  }

  async function call(url: string, init?: RequestInit) {
    const response = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      notify(data.error ?? "Request failed.", "error");
      return null;
    }
    return data;
  }

  async function refresh() {
    const data = await call("/api/portal/customers");
    if (data?.customers) setList(data.customers);
  }

  async function openDetail(customer: CustomerListItem) {
    setDetailLoading(true);
    const data = await call(`/api/portal/customers/${customer.id}`);
    setDetailLoading(false);
    if (data?.customer) setDetail(data.customer);
  }

  async function remove(customer: CustomerListItem) {
    if (!confirm(`Delete ${customer.firstName} ${customer.lastName}? This cannot be undone.`)) return;
    setBusyId(customer.id);
    const data = await call(`/api/portal/customers/${customer.id}`, { method: "DELETE" });
    setBusyId(null);
    if (data?.ok) {
      notify("Customer deleted.");
      if (detail?.id === customer.id) setDetail(null);
      await refresh();
    }
  }

  const staffName = (id: string | null) => {
    if (!id) return "Unassigned";
    const member = staff.find((row) => row.id === id);
    return member ? `${member.firstName} ${member.lastName}` : "Unknown";
  };

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
            placeholder="Search name, email, phone, location..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="sm:max-w-xs"
          />
          <div className="flex flex-wrap rounded-lg bg-gray-100 p-1">
            {["all", "buyer", "renter", "investor", "seller"].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTypeFilter(value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                  typeFilter === value ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-dark"
                )}
              >
                {value === "all" ? "All" : `${value}s`}
              </button>
            ))}
          </div>
        </div>
        {canCreate && (
          <Button onClick={() => setEditor(emptyEditor())}>
            <Plus className="mr-2 h-4 w-4" />
            Add customer
          </Button>
        )}
      </div>

      <Card title="Customer records" description={`${list.length} total · ${filtered.length} shown`}>
        {filtered.length === 0 ? (
          <EmptyState
            title="No customers found"
            description={list.length === 0 ? "Add your first customer to get started." : "Try adjusting your search or filters."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2">Customer</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Budget</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Assigned to</th>
                  <th className="px-3 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((customer) => (
                  <tr key={customer.id} className="border-b border-gray-50 align-top">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <UserRound className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => openDetail(customer)}
                            className="truncate font-semibold text-dark hover:text-primary"
                          >
                            {customer.firstName} {customer.lastName}
                          </button>
                          <p className="truncate text-xs text-gray-500">{customer.email || "No email"}</p>
                          <p className="truncate text-xs text-gray-400">{customer.phone || "No phone"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium capitalize text-primary">
                        {customer.type}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-600">
                      {customer.budgetMin || customer.budgetMax
                        ? `$${customer.budgetMin.toLocaleString()} – $${customer.budgetMax.toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill status={customer.status} />
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-600">{staffName(customer.assignedTo)}</td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        <IconAction title="View record" disabled={busyId !== null || detailLoading} onClick={() => openDetail(customer)}>
                          <BookOpen className="h-3.5 w-3.5" />
                        </IconAction>
                        {canEdit && (
                          <IconAction title="Edit" disabled={busyId !== null} onClick={() => setEditor(fromCustomer(customer))}>
                            <Pencil className="h-3.5 w-3.5" />
                          </IconAction>
                        )}
                        {canDelete && (
                          <IconAction danger title="Delete" disabled={busyId !== null} onClick={() => remove(customer)}>
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
        <CustomerEditor
          state={editor}
          staff={staff}
          onClose={() => setEditor(null)}
          onSaved={async (createdId) => {
            setEditor(null);
            notify(createdId ? "Customer created." : "Customer updated.");
            await refresh();
          }}
        />
      )}

      {detail && (
        <CustomerDetailPanel
          detail={detail}
          staff={staff}
          propertyOptions={propertyOptions}
          canNotes={canNotes}
          canEdit={canEdit}
          canSeeEnquiries={canSeeEnquiries}
          canSeeBookings={canSeeBookings}
          canSeeSaved={canSeeSaved}
          onClose={() => setDetail(null)}
          onChanged={async () => {
            await refresh();
            const data = await call(`/api/portal/customers/${detail.id}`);
            if (data?.customer) setDetail(data.customer);
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
/*  Customer editor (create / update)                                          */
/* -------------------------------------------------------------------------- */

function CustomerEditor({
  state: initial,
  staff,
  onClose,
  onSaved,
}: {
  state: EditorState;
  staff: StaffOption[];
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
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      phone: form.phone,
      type: form.type,
      status: form.status,
      source: form.source,
      budgetMin: Number(form.budgetMin) || 0,
      budgetMax: Number(form.budgetMax) || 0,
      preferredLocation: form.preferredLocation,
      notes: form.notes,
      assignedTo: form.assignedTo || null,
    };

    const url = isEdit ? `/api/portal/customers/${form.id}` : "/api/portal/customers";
    const response = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setError(data.error ?? "Unable to save customer.");
      return;
    }
    onSaved(isEdit ? undefined : data.customer?.id);
  }

  const inputClass =
    "h-12 w-full rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <form onSubmit={submit} className="my-4 w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="font-heading text-base font-bold text-dark">
              {isEdit ? "Edit customer" : "Add customer"}
            </h2>
            <p className="text-xs text-gray-500">
              {isEdit ? `${form.firstName} ${form.lastName}` : "Create a new customer record"}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name">
              <Input required value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
            </Field>
            <Field label="Last name">
              <Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </Field>
            <Field label="Type">
              <select className={inputClass} value={form.type} onChange={(e) => set("type", e.target.value)}>
                <option value="buyer">Buyer</option>
                <option value="renter">Renter</option>
                <option value="investor">Investor</option>
                <option value="seller">Seller</option>
              </select>
            </Field>
            <Field label="Status">
              <select className={inputClass} value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="active">Active</option>
                <option value="lead">Lead</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
            <Field label="Budget min (USD)">
              <Input type="number" min={0} value={form.budgetMin} onChange={(e) => set("budgetMin", e.target.value)} />
            </Field>
            <Field label="Budget max (USD)">
              <Input type="number" min={0} value={form.budgetMax} onChange={(e) => set("budgetMax", e.target.value)} />
            </Field>
            <Field label="Preferred location" className="sm:col-span-2">
              <Input value={form.preferredLocation} onChange={(e) => set("preferredLocation", e.target.value)} placeholder="e.g. Manhattan, Miami Beach" />
            </Field>
            <Field label="Source">
              <Input value={form.source} onChange={(e) => set("source", e.target.value)} placeholder="e.g. Website, Referral" />
            </Field>
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
            <Field label="Notes" className="sm:col-span-2">
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Preferences, background... (internal notes can also be added to the record timeline)" />
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
            {isEdit ? "Save changes" : "Create customer"}
          </Button>
        </footer>
      </form>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Customer 360° drawer                                                       */
/* -------------------------------------------------------------------------- */

function CustomerDetailPanel({
  detail,
  staff,
  propertyOptions,
  canNotes,
  canEdit,
  canSeeEnquiries,
  canSeeBookings,
  canSeeSaved,
  onClose,
  onChanged,
  notify,
}: {
  detail: CustomerDetail;
  staff: StaffOption[];
  propertyOptions: { id: string; title: string; city: string }[];
  canNotes: boolean;
  canEdit: boolean;
  canSeeEnquiries: boolean;
  canSeeBookings: boolean;
  canSeeSaved: boolean;
  onClose: () => void;
  onChanged: () => Promise<void>;
  notify: (text: string, tone?: "ok" | "error") => void;
}) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedSelection, setSavedSelection] = useState<string[]>(detail.savedPropertyIds);

  async function post(url: string, body?: unknown) {
    const response = await fetch(url, {
      method: body === undefined ? "POST" : "POST",
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

  async function addNote() {
    const body = note.trim();
    if (!body) return;
    setSaving(true);
    const data = await post(`/api/portal/customers/${detail.id}/notes`, { body });
    setSaving(false);
    if (data?.note) {
      setNote("");
      notify("Note added.");
      await onChanged();
    }
  }

  async function saveProperties() {
    setSaving(true);
    const data = await fetch(`/api/portal/customers/${detail.id}/saved`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyIds: savedSelection }),
    }).then(async (response) => ({ ok: response.ok, data: await response.json().catch(() => ({})) }));
    setSaving(false);
    if (data.ok) {
      notify("Saved properties updated.");
      await onChanged();
    } else {
      notify(data.data.error ?? "Unable to update saved properties.", "error");
    }
  }

  const staffMember = staff.find((member) => member.id === detail.assignedTo);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4">
          <div>
            <h2 className="font-heading text-base font-bold text-dark">
              {detail.firstName} {detail.lastName}
            </h2>
            <p className="text-xs capitalize text-gray-500">
              {detail.type} · {detail.status}
              {staffMember ? ` · assigned to ${staffMember.firstName} ${staffMember.lastName}` : ""}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-6 px-6 py-5">
          {/* Contact */}
          <section>
            <h3 className="mb-2 text-sm font-bold text-dark">Contact</h3>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <dt className="text-[11px] uppercase text-gray-400">Email</dt>
                <dd className="text-gray-700">{detail.email || "—"}</dd>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <dt className="text-[11px] uppercase text-gray-400">Phone</dt>
                <dd className="text-gray-700">{detail.phone || "—"}</dd>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <dt className="text-[11px] uppercase text-gray-400">Preferred location</dt>
                <dd className="text-gray-700">{detail.preferredLocation || "—"}</dd>
              </div>
              <div className="rounded-lg bg-gray-50 px-3 py-2">
                <dt className="text-[11px] uppercase text-gray-400">Budget</dt>
                <dd className="text-gray-700">
                  {detail.budgetMin || detail.budgetMax
                    ? `$${detail.budgetMin.toLocaleString()} – $${detail.budgetMax.toLocaleString()}`
                    : "—"}
                </dd>
              </div>
            </dl>
            {detail.notes && (
              <p className="mt-3 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {detail.notes}
              </p>
            )}
          </section>

          {/* Saved properties */}
          {canSeeSaved && (
            <section>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-dark">
                <Heart className="h-4 w-4 text-primary" /> Saved properties
              </h3>
              <div className="space-y-2">
                {propertyOptions.map((property) => {
                  const checked = savedSelection.includes(property.id);
                  return (
                    <label
                      key={property.id}
                      className={cn(
                        "flex items-center gap-3 rounded-lg border px-3 py-2 text-sm",
                        checked ? "border-primary/40 bg-primary/5" : "border-gray-100",
                        !canEdit && "pointer-events-none opacity-70"
                      )}
                    >
                      <input
                        type="checkbox"
                        disabled={!canEdit}
                        checked={checked}
                        onChange={() =>
                          setSavedSelection((current) =>
                            checked ? current.filter((id) => id !== property.id) : [...current, property.id]
                          )
                        }
                      />
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span className="flex-1 truncate text-gray-700">{property.title}</span>
                      <span className="text-xs text-gray-400">{property.city}</span>
                    </label>
                  );
                })}
                {propertyOptions.length === 0 && (
                  <p className="text-xs text-gray-400">No properties available to shortlist.</p>
                )}
              </div>
              {canEdit && (
                <Button size="sm" variant="outline" className="mt-3" onClick={saveProperties} disabled={saving}>
                  Save selection
                </Button>
              )}
            </section>
          )}

          {/* Enquiries */}
          {canSeeEnquiries && (
            <section>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-dark">
                <MessageSquare className="h-4 w-4 text-primary" /> Enquiries ({detail.enquiries.length})
              </h3>
              {detail.enquiries.length === 0 ? (
                <p className="text-xs text-gray-400">No enquiries linked to this customer.</p>
              ) : (
                <ul className="divide-y divide-gray-50 text-sm">
                  {detail.enquiries.map((enquiry) => (
                    <li key={enquiry.id} className="flex items-center justify-between gap-3 py-2">
                      <div>
                        <p className="font-medium text-gray-700">{enquiry.subject || "No subject"}</p>
                        <p className="text-xs text-gray-400">
                          {enquiry.reference} · {new Date(enquiry.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <StatusPill status={enquiry.status} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* Bookings */}
          {canSeeBookings && (
            <section>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-dark">
                <CalendarCheck className="h-4 w-4 text-primary" /> Bookings ({detail.bookings.length})
              </h3>
              {detail.bookings.length === 0 ? (
                <p className="text-xs text-gray-400">No bookings linked to this customer.</p>
              ) : (
                <ul className="divide-y divide-gray-50 text-sm">
                  {detail.bookings.map((booking) => (
                    <li key={booking.id} className="flex items-center justify-between gap-3 py-2">
                      <div>
                        <p className="font-medium capitalize text-gray-700">{booking.type}</p>
                        <p className="text-xs text-gray-400">
                          {booking.reference} · {new Date(booking.scheduledAt).toLocaleString()}
                        </p>
                      </div>
                      <StatusPill status={booking.status} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* Internal notes */}
          <section>
            <h3 className="mb-2 text-sm font-bold text-dark">Internal notes</h3>
            <ul className="space-y-2">
              {detail.internalNotes.map((entry) => (
                <li key={entry.id} className="rounded-lg bg-gray-50 px-3 py-2 text-sm">
                  <p className="text-gray-700">{entry.body}</p>
                  <p className="mt-1 text-[11px] text-gray-400">
                    {entry.userEmail} · {new Date(entry.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
              {detail.internalNotes.length === 0 && (
                <p className="text-xs text-gray-400">No internal notes yet.</p>
              )}
            </ul>
            {canNotes && (
              <div className="mt-3 space-y-2">
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an internal note..." />
                <Button size="sm" onClick={addNote} disabled={saving || !note.trim()}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Add note
                </Button>
              </div>
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
