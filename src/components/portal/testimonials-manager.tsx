"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, Pencil, Plus, Quote, Star, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Card, EmptyState } from "./ui";

export interface TestimonialRow {
  id: string;
  name: string;
  role: string;
  quote: string;
  avatarUrl: string;
  rating: number;
  isPublished: boolean;
  sortOrder: number;
}

interface EditorState {
  id: string | null;
  name: string;
  role: string;
  quote: string;
  avatarUrl: string;
  rating: string;
  sortOrder: string;
  isPublished: boolean;
}

function emptyEditor(): EditorState {
  return { id: null, name: "", role: "", quote: "", avatarUrl: "", rating: "5", sortOrder: "0", isPublished: true };
}

export function TestimonialsManager({
  initialTestimonials,
  canManage,
}: {
  initialTestimonials: TestimonialRow[];
  canManage: boolean;
}) {
  const [list, setList] = useState(initialTestimonials);
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
    const data = await call("/api/portal/cms/testimonials");
    if (data?.testimonials) setList(data.testimonials);
  }

  async function togglePublish(row: TestimonialRow) {
    setBusyId(row.id);
    const data = await call(`/api/portal/cms/testimonials/${row.id}`, "PATCH", { isPublished: !row.isPublished });
    setBusyId(null);
    if (data?.testimonial) {
      notify(row.isPublished ? "Testimonial unpublished." : "Testimonial published.");
      await refresh();
    }
  }

  async function remove(row: TestimonialRow) {
    if (!confirm(`Delete the testimonial from ${row.name}?`)) return;
    setBusyId(row.id);
    const data = await call(`/api/portal/cms/testimonials/${row.id}`, "DELETE");
    setBusyId(null);
    if (data?.ok) {
      notify("Testimonial deleted.");
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
            Add testimonial
          </Button>
        </div>
      )}

      <Card
        title="All testimonials"
        description={`${list.length} total · ${list.filter((row) => row.isPublished).length} published`}
      >
        {list.length === 0 ? (
          <EmptyState title="No testimonials yet" description="Add the first client testimonial." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {list.map((row) => (
              <article
                key={row.id}
                className={cn(
                  "flex flex-col rounded-xl border p-4",
                  row.isPublished ? "border-gray-200 bg-white" : "border-dashed border-gray-200 bg-gray-50/50 opacity-75"
                )}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    {row.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={row.avatarUrl} alt={row.name} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Quote className="h-4 w-4" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-dark">{row.name}</p>
                      <p className="text-xs text-gray-500">{row.role || "Client"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        className={cn("h-3.5 w-3.5", index < row.rating ? "fill-amber-400 text-amber-400" : "text-gray-200")}
                      />
                    ))}
                  </div>
                </div>
                <p className="flex-1 text-sm leading-relaxed text-gray-600">“{row.quote}”</p>
                <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-3">
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                      row.isPublished
                        ? "border-green-200 bg-green-50 text-green-700"
                        : "border-gray-200 bg-gray-100 text-gray-500"
                    )}
                  >
                    {row.isPublished ? "Published" : "Hidden"}
                  </span>
                  {canManage && (
                    <div className="flex gap-1.5">
                      <SmallAction title={row.isPublished ? "Unpublish" : "Publish"} disabled={busyId !== null} onClick={() => togglePublish(row)}>
                        {row.isPublished ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </SmallAction>
                      <SmallAction
                        title="Edit"
                        disabled={busyId !== null}
                        onClick={() =>
                          setEditor({
                            id: row.id,
                            name: row.name,
                            role: row.role,
                            quote: row.quote,
                            avatarUrl: row.avatarUrl,
                            rating: String(row.rating),
                            sortOrder: String(row.sortOrder),
                            isPublished: row.isPublished,
                          })
                        }
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </SmallAction>
                      <SmallAction danger title="Delete" disabled={busyId !== null} onClick={() => remove(row)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </SmallAction>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>

      {editor && (
        <TestimonialEditor
          state={editor}
          onClose={() => setEditor(null)}
          onSaved={async (created) => {
            setEditor(null);
            notify(created ? "Testimonial added." : "Testimonial updated.");
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

function TestimonialEditor({
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
      name: form.name,
      role: form.role,
      quote: form.quote,
      avatarUrl: form.avatarUrl,
      rating: Number(form.rating) || 5,
      sortOrder: Number(form.sortOrder) || 0,
      isPublished: form.isPublished,
    };

    const url = isEdit ? `/api/portal/cms/testimonials/${form.id}` : "/api/portal/cms/testimonials";
    const response = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setError(data.error ?? "Unable to save testimonial.");
      return;
    }
    onSaved(!isEdit);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <form onSubmit={submit} className="my-4 w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="font-heading text-base font-bold text-dark">
            {isEdit ? "Edit testimonial" : "Add testimonial"}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">Name</span>
              <Input required value={form.name} onChange={(e) => set("name", e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">Role / location</span>
              <Input value={form.role} onChange={(e) => set("role", e.target.value)} placeholder="e.g. Homeowner, Miami" />
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">Quote</span>
            <Textarea required value={form.quote} onChange={(e) => set("quote", e.target.value)} className="min-h-[110px]" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">Avatar image URL</span>
            <Input value={form.avatarUrl} onChange={(e) => set("avatarUrl", e.target.value)} placeholder="https://… (optional)" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">Rating (1–5)</span>
              <Input type="number" min={1} max={5} value={form.rating} onChange={(e) => set("rating", e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">Sort order</span>
              <Input type="number" value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} />
            </label>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => set("isPublished", e.target.checked)} />
            Published on the public website
          </label>
        </div>

        {error && <p className="border-t border-red-100 bg-red-50 px-6 py-2 text-sm text-red-700">{error}</p>}

        <footer className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Save changes" : "Add testimonial"}
          </Button>
        </footer>
      </form>
    </div>
  );
}
