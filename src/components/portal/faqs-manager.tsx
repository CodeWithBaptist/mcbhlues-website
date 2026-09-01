"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Eye, EyeOff, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Card, EmptyState } from "./ui";

export interface FaqRow {
  id: string;
  question: string;
  answer: string;
  category: string;
  isPublished: boolean;
  sortOrder: number;
}

interface EditorState {
  id: string | null;
  question: string;
  answer: string;
  category: string;
  sortOrder: string;
  isPublished: boolean;
}

function emptyEditor(): EditorState {
  return { id: null, question: "", answer: "", category: "general", sortOrder: "0", isPublished: true };
}

const CATEGORIES = ["general", "buying", "renting", "selling"];

export function FaqsManager({ initialFaqs, canManage }: { initialFaqs: FaqRow[]; canManage: boolean }) {
  const [list, setList] = useState(initialFaqs);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editor, setEditor] = useState<EditorState | null>(null);

  const filtered = useMemo(
    () => list.filter((faq) => categoryFilter === "all" || faq.category === categoryFilter),
    [list, categoryFilter]
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
    const data = await call("/api/portal/cms/faqs");
    if (data?.faqs) setList(data.faqs);
  }

  async function togglePublish(row: FaqRow) {
    setBusyId(row.id);
    const data = await call(`/api/portal/cms/faqs/${row.id}`, "PATCH", { isPublished: !row.isPublished });
    setBusyId(null);
    if (data?.faq) {
      notify(row.isPublished ? "FAQ unpublished." : "FAQ published.");
      await refresh();
    }
  }

  async function remove(row: FaqRow) {
    if (!confirm(`Delete “${row.question}”?`)) return;
    setBusyId(row.id);
    const data = await call(`/api/portal/cms/faqs/${row.id}`, "DELETE");
    setBusyId(null);
    if (data?.ok) {
      notify("FAQ deleted.");
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap rounded-lg bg-gray-100 p-1">
          {["all", ...CATEGORIES].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setCategoryFilter(value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                categoryFilter === value ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-dark"
              )}
            >
              {value}
            </button>
          ))}
        </div>
        {canManage && (
          <Button onClick={() => setEditor(emptyEditor())}>
            <Plus className="mr-2 h-4 w-4" />
            Add FAQ
          </Button>
        )}
      </div>

      <Card title="FAQs" description={`${list.length} total · ${list.filter((row) => row.isPublished).length} published`}>
        {filtered.length === 0 ? (
          <EmptyState title="No FAQs found" description="Add the first frequently asked question." />
        ) : (
          <ul className="divide-y divide-gray-100">
            {filtered.map((faq) => (
              <li key={faq.id} className={cn("py-3", !faq.isPublished && "opacity-60")}>
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    className="flex flex-1 items-center justify-between gap-3 text-left"
                    onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                  >
                    <span className="text-sm font-semibold text-dark">{faq.question}</span>
                    <ChevronDown
                      className={cn("h-4 w-4 shrink-0 text-gray-400 transition-transform", openId === faq.id && "rotate-180")}
                    />
                  </button>
                  {canManage && (
                    <div className="flex shrink-0 gap-1.5">
                      <SmallAction title={faq.isPublished ? "Unpublish" : "Publish"} disabled={busyId !== null} onClick={() => togglePublish(faq)}>
                        {faq.isPublished ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </SmallAction>
                      <SmallAction
                        title="Edit"
                        disabled={busyId !== null}
                        onClick={() =>
                          setEditor({
                            id: faq.id,
                            question: faq.question,
                            answer: faq.answer,
                            category: faq.category,
                            sortOrder: String(faq.sortOrder),
                            isPublished: faq.isPublished,
                          })
                        }
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </SmallAction>
                      <SmallAction danger title="Delete" disabled={busyId !== null} onClick={() => remove(faq)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </SmallAction>
                    </div>
                  )}
                </div>
                {openId === faq.id && (
                  <div className="mt-2 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">{faq.answer}</div>
                )}
                <p className="mt-1 text-[11px] capitalize text-gray-400">
                  {faq.category} · order {faq.sortOrder} · {faq.isPublished ? "published" : "hidden"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {editor && (
        <FaqEditor
          state={editor}
          onClose={() => setEditor(null)}
          onSaved={async (created) => {
            setEditor(null);
            notify(created ? "FAQ added." : "FAQ updated.");
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

function FaqEditor({
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
      question: form.question,
      answer: form.answer,
      category: form.category,
      sortOrder: Number(form.sortOrder) || 0,
      isPublished: form.isPublished,
    };

    const url = isEdit ? `/api/portal/cms/faqs/${form.id}` : "/api/portal/cms/faqs";
    const response = await fetch(url, {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setError(data.error ?? "Unable to save FAQ.");
      return;
    }
    onSaved(!isEdit);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <form onSubmit={submit} className="my-4 w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="font-heading text-base font-bold text-dark">{isEdit ? "Edit FAQ" : "Add FAQ"}</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 py-5">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">Question</span>
            <Input required value={form.question} onChange={(e) => set("question", e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">Answer</span>
            <Textarea required value={form.answer} onChange={(e) => set("answer", e.target.value)} className="min-h-[120px]" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">Category</span>
              <select
                className="h-12 w-full rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category} className="capitalize">
                    {category}
                  </option>
                ))}
              </select>
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
            {isEdit ? "Save changes" : "Add FAQ"}
          </Button>
        </footer>
      </form>
    </div>
  );
}
