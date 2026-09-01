"use client";

import { useState } from "react";
import { Loader2, Save, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CmsBlock } from "@/lib/cms/cms-service";
import { Card } from "./ui";

export interface CmsProperty {
  id: string;
  title: string;
  city: string;
  status: string;
  isPublished: boolean;
  isFeatured: boolean;
  imageUrl: string;
}

interface CmsManagerProps {
  blocks: CmsBlock[];
  properties: CmsProperty[];
  permissions: string[];
}

const SECTION_PERMISSION: Record<string, string> = {
  homepage: "cms:homepage",
  about: "cms:about",
  services: "cms:services",
  contact: "cms:contact",
  general: "cms:update",
};

export function CmsManager({ blocks, properties, permissions }: CmsManagerProps) {
  const canUpdate = permissions.includes("cms:update");
  const canFeatured = permissions.includes("cms:featured_properties");

  const sections = [...new Set(blocks.map((block) => block.section))];

  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(blocks.map((block) => [block.key, block.value]))
  );
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  function notify(text: string, tone: "ok" | "error" = "ok") {
    setMessage({ tone, text });
  }

  function editable(section: string) {
    return canUpdate || permissions.includes(SECTION_PERMISSION[section] ?? "cms:update");
  }

  async function saveBlock(block: CmsBlock) {
    setSavingKey(block.key);
    const response = await fetch("/api/portal/cms/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: block.key, value: values[block.key] ?? "" }),
    });
    const data = await response.json().catch(() => ({}));
    setSavingKey(null);
    if (!response.ok) {
      notify(data.error ?? `Unable to save ${block.label}.`, "error");
      return;
    }
    notify(`“${block.label}” saved — live on the website immediately.`);
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

      {sections.map((section) => (
        <Card
          key={section}
          title={`${section[0].toUpperCase()}${section.slice(1)} content`}
          description={`Requires ${canUpdate ? "cms:update or " : ""}${SECTION_PERMISSION[section] ?? "cms:update"}`}
        >
          <div className="space-y-4">
            {blocks
              .filter((block) => block.section === section)
              .map((block) => {
                const canEditThis = editable(section);
                return (
                  <div key={block.key}>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-gray-700">{block.label}</span>
                      {canEditThis && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => saveBlock(block)}
                          disabled={savingKey !== null}
                        >
                          {savingKey === block.key ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Save className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          Save
                        </Button>
                      )}
                    </div>
                    {block.multiline ? (
                      <Textarea
                        value={values[block.key] ?? ""}
                        placeholder={block.placeholder}
                        disabled={!canEditThis}
                        onChange={(e) => setValues({ ...values, [block.key]: e.target.value })}
                      />
                    ) : (
                      <Input
                        value={values[block.key] ?? ""}
                        placeholder={block.placeholder}
                        disabled={!canEditThis}
                        onChange={(e) => setValues({ ...values, [block.key]: e.target.value })}
                      />
                    )}
                    <p className="mt-1 text-[11px] text-gray-400">{block.key}</p>
                  </div>
                );
              })}
          </div>
        </Card>
      ))}

      {canFeatured && (
        <Card
          title="Featured properties"
          description="Starred listings appear in the homepage “Featured Properties” section. Requires cms:featured_properties."
        >
          <FeaturedPicker properties={properties} notify={notify} />
        </Card>
      )}
    </div>
  );
}

function FeaturedPicker({
  properties,
  notify,
}: {
  properties: CmsProperty[];
  notify: (text: string, tone?: "ok" | "error") => void;
}) {
  const [items, setItems] = useState(properties);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggle(property: CmsProperty) {
    setBusyId(property.id);
    const response = await fetch("/api/portal/cms/featured", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ propertyId: property.id, featured: !property.isFeatured }),
    });
    const data = await response.json().catch(() => ({}));
    setBusyId(null);
    if (!response.ok) {
      notify(data.error ?? "Unable to update the featured flag.", "error");
      return;
    }
    setItems((current) =>
      current.map((item) => (item.id === property.id ? { ...item, isFeatured: !item.isFeatured } : item))
    );
    notify(property.isFeatured ? `“${property.title}” removed from the homepage.` : `“${property.title}” now featured on the homepage.`);
  }

  if (items.length === 0) {
    return <p className="text-sm text-gray-500">No properties to curate yet.</p>;
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((property) => (
        <button
          key={property.id}
          type="button"
          onClick={() => toggle(property)}
          disabled={busyId === property.id}
          className={cn(
            "group relative overflow-hidden rounded-lg border text-left transition-colors",
            property.isFeatured ? "border-amber-300 bg-amber-50/60" : "border-gray-200 hover:border-primary/40"
          )}
        >
          <div className="h-24 w-full bg-gray-100">
            {property.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={property.imageUrl} alt={property.title} className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-2 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-800">{property.title}</p>
              <p className="text-xs capitalize text-gray-400">
                {property.city || "—"} · {property.isPublished ? "published" : "draft"}
              </p>
            </div>
            <Star
              className={cn(
                "h-5 w-5 shrink-0",
                property.isFeatured
                  ? "fill-amber-400 text-amber-400"
                  : "text-gray-300 group-hover:text-amber-300"
              )}
            />
          </div>
        </button>
      ))}
    </div>
  );
}
