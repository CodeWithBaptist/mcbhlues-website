"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "./ui";
import { useSession } from "./permission-provider";

export interface SettingField {
  key: string;
  label: string;
  placeholder?: string;
}

export function SettingsForm({
  scope,
  fields,
  initial,
  requiredPermission,
}: {
  scope: "company" | "system";
  fields: SettingField[];
  initial: Record<string, string>;
  requiredPermission: string;
}) {
  const { can } = useSession();
  const editable = can(requiredPermission);

  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((field) => [field.key, initial[field.key] ?? ""]))
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);
    for (const field of fields) {
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
    setSaving(false);
    setMessage({ tone: "ok", text: "Settings saved and recorded in the audit log." });
  }

  return (
    <Card
      title={scope === "company" ? "Company settings" : "System settings"}
      description={`Requires ${requiredPermission}`}
      actions={
        editable ? (
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save
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
        {fields.map((field) => (
          <label key={field.key} className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">{field.label}</span>
            <Input
              value={values[field.key]}
              placeholder={field.placeholder}
              disabled={!editable}
              onChange={(event) => setValues({ ...values, [field.key]: event.target.value })}
            />
            <span className="mt-1 block text-[11px] text-gray-400">{field.key}</span>
          </label>
        ))}
      </div>
    </Card>
  );
}
