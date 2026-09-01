"use client";

import { useState } from "react";
import { Loader2, Mail, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { EmailTemplateView } from "@/lib/settings/email-templates";
import { Card } from "./ui";

export function EmailTemplatesManager({
  templates: initialTemplates,
}: {
  templates: EmailTemplateView[];
}) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [activeKey, setActiveKey] = useState(initialTemplates[0]?.key ?? "");
  const [draft, setDraft] = useState<{ subject: string; body: string }>(() => {
    const first = initialTemplates[0];
    return { subject: first?.subject ?? "", body: first?.body ?? "" };
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const active = templates.find((template) => template.key === activeKey);

  function select(key: string) {
    const template = templates.find((item) => item.key === key);
    if (!template) return;
    setActiveKey(key);
    setDraft({ subject: template.subject, body: template.body });
    setMessage(null);
  }

  async function save() {
    if (!active) return;
    setSaving(true);
    setMessage(null);
    const response = await fetch("/api/portal/email-templates", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: active.key, subject: draft.subject, body: draft.body }),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setMessage({ tone: "error", text: data.error ?? "Unable to save template." });
      return;
    }
    setTemplates((current) =>
      current.map((item) => (item.key === active.key ? { ...item, ...data.template } : item))
    );
    setMessage({ tone: "ok", text: "Template saved and recorded in the audit log." });
  }

  // Collect the {{placeholders}} referenced by the current draft.
  const placeholders = [
    ...new Set([draft.subject, draft.body].flatMap((text) => [...text.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]))),
  ];

  return (
    <Card
      title="Email templates"
      description="Outgoing messages sent by the portal. Use {{placeholders}} for dynamic values. Requires settings:email_templates."
    >
      {message && (
        <p
          className={cn(
            "mb-4 rounded-md border px-3 py-2 text-sm",
            message.tone === "ok"
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-red-200 bg-red-50 text-red-700"
          )}
        >
          {message.text}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <ul className="space-y-2">
          {templates.map((template) => (
            <li key={template.key}>
              <button
                type="button"
                onClick={() => select(template.key)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  template.key === activeKey
                    ? "border-primary bg-primary/5 font-semibold text-primary"
                    : "border-gray-200 text-gray-600 hover:border-primary/40"
                )}
              >
                <Mail className="h-4 w-4 shrink-0" />
                <span>
                  {template.name}
                  <span className="block text-[11px] font-normal text-gray-400">
                    {template.updatedAt ? `edited ${new Date(template.updatedAt).toLocaleDateString()}` : "default"}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        {active && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">{active.description}</p>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">Subject</span>
              <Input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">Body</span>
              <Textarea
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                className="min-h-[220px] font-mono text-xs"
              />
            </label>
            {placeholders.length > 0 && (
              <p className="text-[11px] text-gray-400">
                Placeholders in use: {placeholders.map((name) => `{{${name}}}`).join(", ")}
              </p>
            )}
            <div className="flex justify-end">
              <Button size="sm" onClick={save} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save template
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
