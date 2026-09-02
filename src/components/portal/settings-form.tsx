"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "./ui";
import { useSession } from "./permission-provider";

export interface SettingFieldOption {
  value: string;
  label: string;
}

export interface SettingField {
  key: string;
  label: string;
  placeholder?: string;
  /** text (default) · number · select · toggle · textarea */
  type?: "text" | "number" | "select" | "toggle" | "textarea";
  options?: SettingFieldOption[];
  help?: string;
  min?: number;
  max?: number;
  /** Render the field across the full width of the grid. */
  wide?: boolean;
}

export function SettingsForm({
  scope,
  fields,
  initial,
  requiredPermission,
  title,
  description,
}: {
  scope: "company" | "system" | "security";
  fields: SettingField[];
  initial: Record<string, string>;
  requiredPermission: string;
  title?: string;
  description?: string;
}) {
  const { can } = useSession();
  const editable = can(requiredPermission);

  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((field) => [field.key, initial[field.key] ?? ""]))
  );
  const [savedValues, setSavedValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((field) => [field.key, initial[field.key] ?? ""]))
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const dirty = fields.some((field) => values[field.key] !== savedValues[field.key]);

  async function save() {
    setSaving(true);
    setMessage(null);
    const changed = fields.filter((field) => values[field.key] !== savedValues[field.key]);
    if (changed.length === 0) {
      setSaving(false);
      setMessage({ tone: "ok", text: "Nothing to save — no values were changed." });
      return;
    }
    for (const field of changed) {
      const response = await fetch("/api/portal/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope, key: field.key, value: values[field.key] }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setMessage({ tone: "error", text: data.error ?? "Unable to save settings." });
        setSaving(false);
        return;
      }
    }
    setSavedValues(values);
    setSaving(false);
    setMessage({
      tone: "ok",
      text: `Saved ${changed.length} change${changed.length === 1 ? "" : "s"} — recorded in the audit log.`,
    });
  }

  return (
    <Card
      title={title ?? (scope === "company" ? "Company settings" : scope === "security" ? "Security settings" : "System settings")}
      description={description ?? `Requires ${requiredPermission}`}
      actions={
        editable ? (
          <Button size="sm" onClick={save} disabled={saving || !dirty}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {dirty ? "Save changes" : "Saved"}
          </Button>
        ) : undefined
      }
    >
      {message && (
        <p
          className={
            message.tone === "ok"
              ? "mb-4 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700"
              : "mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          }
        >
          {message.text}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          const value = values[field.key] ?? "";
          const update = (next: string) => setValues({ ...values, [field.key]: next });

          return (
            <div key={field.key} className={field.wide ? "sm:col-span-2" : undefined}>
              {field.type === "toggle" ? (
                <div className="flex h-full flex-col justify-center rounded-md border border-gray-200 px-4 py-3">
                  <label className="flex cursor-pointer items-center justify-between gap-3">
                    <span className="text-sm font-medium text-gray-700">{field.label}</span>
                    <input
                      type="checkbox"
                      className="h-5 w-5 accent-[var(--color-primary,#1d4ed8)]"
                      disabled={!editable}
                      checked={value === "true"}
                      onChange={(event) => update(event.target.checked ? "true" : "false")}
                    />
                  </label>
                  {field.help && <p className="mt-1 text-xs text-gray-500">{field.help}</p>}
                </div>
              ) : (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">{field.label}</span>
                  {field.type === "select" ? (
                    <select
                      className="h-12 w-full rounded-md border border-gray-200 bg-white px-4 text-sm text-dark focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                      value={value}
                      disabled={!editable}
                      onChange={(event) => update(event.target.value)}
                    >
                      {(field.options ?? []).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea
                      className="min-h-24 w-full rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-dark focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                      value={value}
                      placeholder={field.placeholder}
                      disabled={!editable}
                      onChange={(event) => update(event.target.value)}
                    />
                  ) : (
                    <Input
                      type={field.type === "number" ? "number" : "text"}
                      min={field.min}
                      max={field.max}
                      value={value}
                      placeholder={field.placeholder}
                      disabled={!editable}
                      onChange={(event) => update(event.target.value)}
                    />
                  )}
                  {field.help && <p className="mt-1 text-xs text-gray-500">{field.help}</p>}
                </label>
              )}
              <span className="mt-1 block text-[11px] text-gray-400">{field.key}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
