"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { LegalDoc } from "@/lib/legal/legal-docs";
import { LegalDocument } from "@/components/sections/legal/legal-document";
import { Card } from "./ui";

interface LegalManagerProps {
  initialDocs: LegalDoc[];
  canManage: boolean;
}

interface Draft {
  title: string;
  summary: string;
  updated: string;
  body: string;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

/**
 * Tabbed editor for the Privacy Policy, Terms & Conditions and Cookie Policy.
 * The preview renders through the same `LegalDocument` component as the
 * public site, so what staff see is exactly what visitors get.
 */
export function LegalManager({ initialDocs, canManage }: LegalManagerProps) {
  const [activeSlug, setActiveSlug] = useState(initialDocs[0]?.slug ?? "privacy");
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(
      initialDocs.map((doc) => [
        doc.slug,
        { title: doc.title, summary: doc.summary, updated: doc.updated, body: doc.body },
      ])
    )
  );
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const active = initialDocs.find((doc) => doc.slug === activeSlug) ?? initialDocs[0];
  const draft: Draft = drafts[active.slug] ?? {
    title: active.title,
    summary: active.summary,
    updated: active.updated,
    body: active.body,
  };
  const busy = saving || resetting;

  function notify(text: string, tone: "ok" | "error" = "ok") {
    setMessage({ tone, text });
  }

  /** Editing the content re-stamps “last updated” to today; staff can still adjust the date by hand. */
  function setField(field: keyof Draft, value: string) {
    setDrafts((current) => ({
      ...current,
      [active.slug]: {
        ...current[active.slug],
        [field]: value,
        ...(field === "updated" ? {} : { updated: todayIso() }),
      },
    }));
  }

  async function save() {
    setSaving(true);
    const response = await fetch("/api/portal/cms/legal", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: active.slug,
        title: draft.title,
        summary: draft.summary,
        body: draft.body,
        lastUpdated: draft.updated,
      }),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      notify(data.error ?? `Unable to save the ${active.label}.`, "error");
      return;
    }
    notify(`“${active.label}” saved — live on the website immediately.`);
  }

  async function reset() {
    if (
      !confirm(
        `Discard every saved change to the ${active.label} and restore the default text? This cannot be undone.`
      )
    ) {
      return;
    }
    setResetting(true);
    const response = await fetch(`/api/portal/cms/legal?slug=${active.slug}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    setResetting(false);
    if (!response.ok || !data.doc) {
      notify(data.error ?? `Unable to reset the ${active.label}.`, "error");
      return;
    }
    const doc = data.doc as LegalDoc;
    setDrafts((current) => ({
      ...current,
      [doc.slug]: { title: doc.title, summary: doc.summary, updated: doc.updated, body: doc.body },
    }));
    notify(`“${doc.label}” restored to the default text.`);
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

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Legal documents">
        {initialDocs.map((doc) => (
          <button
            key={doc.slug}
            type="button"
            role="tab"
            aria-selected={doc.slug === active.slug}
            onClick={() => {
              setActiveSlug(doc.slug);
              setMessage(null);
            }}
            className={cn(
              "rounded-lg border px-4 py-2 text-sm font-semibold transition-colors",
              doc.slug === active.slug
                ? "border-primary bg-primary text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-primary/50 hover:text-primary"
            )}
          >
            {doc.label}
          </button>
        ))}
      </div>

      <Card
        title={active.label}
        description={
          canManage
            ? "Requires cms:legal. Saving publishes straight to the public website."
            : "Requires cms:legal to edit — you have read-only access."
        }
        actions={
          canManage ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void reset()}
                disabled={busy}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-md border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {resetting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" />
                )}
                Reset to default
              </button>
              <Button size="sm" onClick={() => void save()} disabled={busy}>
                {saving ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="mr-1.5 h-3.5 w-3.5" />
                )}
                Save
              </Button>
            </div>
          ) : undefined
        }
      >
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1fr_220px]">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">Page title</span>
              <Input
                value={draft.title}
                disabled={!canManage}
                onChange={(event) => setField("title", event.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">Last updated</span>
              <Input
                type="date"
                value={draft.updated}
                disabled={!canManage}
                onChange={(event) => setField("updated", event.target.value)}
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              Summary <span className="font-normal text-gray-400">(shown under the title)</span>
            </span>
            <Textarea
              value={draft.summary}
              rows={3}
              disabled={!canManage}
              onChange={(event) => setField("summary", event.target.value)}
            />
          </label>

          <div>
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-gray-700">Policy text</span>
              <button
                type="button"
                onClick={() => setShowPreview((value) => !value)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline"
              >
                {showPreview ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {showPreview ? "Hide preview" : "Show preview"}
              </button>
            </div>
            <Textarea
              value={draft.body}
              rows={24}
              disabled={!canManage}
              spellCheck
              onChange={(event) => setField("body", event.target.value)}
              className="font-mono text-sm leading-relaxed"
            />
            <details className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              <summary className="cursor-pointer font-semibold text-gray-700">
                Formatting guide
              </summary>
              <ul className="mt-3 space-y-2 text-[13px] leading-relaxed">
                <li>
                  <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs ring-1 ring-gray-200">
                    ## Section heading
                  </code>{" "}
                  starts a numbered section and adds it to the table of contents.
                </li>
                <li>
                  Separate paragraphs with a <strong>blank line</strong>. Single line
                  breaks join together.
                </li>
                <li>
                  <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs ring-1 ring-gray-200">
                    - item
                  </code>{" "}
                  makes a bullet list. One line per bullet.
                </li>
                <li>
                  <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs ring-1 ring-gray-200">
                    **bold**
                  </code>
                  ,{" "}
                  <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs ring-1 ring-gray-200">
                    *italic*
                  </code>
                  ,{" "}
                  <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs ring-1 ring-gray-200">
                    [text](https://…)
                  </code>{" "}
                  and{" "}
                  <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs ring-1 ring-gray-200">
                    [[TODO]]
                  </code>{" "}
                  for bold, italic, links and highlighted placeholders.
                </li>
                <li>
                  Tables use one line per row between{" "}
                  <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs ring-1 ring-gray-200">
                    |
                  </code>{" "}
                  pipes, with a{" "}
                  <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs ring-1 ring-gray-200">
                    | --- | --- |
                  </code>{" "}
                  line under the header row.
                </li>
              </ul>
            </details>
          </div>
        </div>
      </Card>

      {showPreview && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <p className="border-b border-gray-100 bg-gray-50 px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-gray-500">
            Preview — exactly as visitors see it
          </p>
          <LegalDocument
            doc={{
              slug: active.slug,
              label: active.label,
              title: draft.title || active.label,
              summary: draft.summary,
              updated: draft.updated || todayIso(),
              body: draft.body,
            }}
          />
        </div>
      )}
    </div>
  );
}
