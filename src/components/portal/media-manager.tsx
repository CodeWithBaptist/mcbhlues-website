"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Copy,
  FileText,
  Image as ImageIcon,
  Loader2,
  Plus,
  Shapes,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Card, EmptyState } from "./ui";
import { FileUpload } from "./file-upload";

export interface MediaAssetRow {
  id: string;
  title: string;
  url: string;
  kind: string;
  folder: string;
  alt: string;
  createdAt: string;
}

interface MediaManagerProps {
  initialAssets: MediaAssetRow[];
  permissions: string[];
}

export function MediaManager({ initialAssets, permissions }: MediaManagerProps) {
  const [list, setList] = useState(initialAssets);
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState("all");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const canUpload = permissions.includes("media:upload");
  const canDocuments = permissions.includes("media:documents");
  const canLogo = permissions.includes("media:logo");
  const canDelete = permissions.includes("media:delete");
  const canAddAnything = canUpload || canDocuments || canLogo;

  const filtered = useMemo(
    () =>
      list.filter((asset) => {
        const haystack = `${asset.title} ${asset.url} ${asset.folder} ${asset.alt}`.toLowerCase();
        const matchesSearch = haystack.includes(search.toLowerCase());
        const matchesKind = kindFilter === "all" || asset.kind === kindFilter;
        return matchesSearch && matchesKind;
      }),
    [list, search, kindFilter]
  );

  function notify(text: string, tone: "ok" | "error" = "ok") {
    setMessage({ tone, text });
  }

  async function remove(asset: MediaAssetRow) {
    if (!confirm(`Delete “${asset.title}” from the library?`)) return;
    setBusyId(asset.id);
    const response = await fetch(`/api/portal/media/${asset.id}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    setBusyId(null);
    if (!response.ok) {
      notify(data.error ?? "Unable to delete the asset.", "error");
      return;
    }
    notify("Asset deleted.");
    setList((current) => current.filter((row) => row.id !== asset.id));
  }

  async function copyUrl(asset: MediaAssetRow) {
    try {
      await navigator.clipboard.writeText(asset.url);
      setCopiedId(asset.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      notify("Could not access the clipboard.", "error");
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
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder="Search title, URL, folder..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="sm:max-w-xs"
          />
          <div className="flex flex-wrap rounded-lg bg-gray-100 p-1">
            {["all", "image", "document", "logo"].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setKindFilter(value)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                  kindFilter === value ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-dark"
                )}
              >
                {value === "all" ? "All" : `${value}s`}
              </button>
            ))}
          </div>
        </div>
        {canAddAnything && (
          <Button onClick={() => setAdding(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add asset
          </Button>
        )}
      </div>

      <Card title="Library" description={`${list.length} assets · ${filtered.length} shown`}>
        {filtered.length === 0 ? (
          <EmptyState
            title="The library is empty"
            description="Upload images, documents or the company logo from your device — or register a link — then reuse those URLs across listings and CMS content."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filtered.map((asset) => (
              <article key={asset.id} className="group overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="flex h-36 items-center justify-center bg-gray-50">
                  {asset.kind === "image" || asset.kind === "logo" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={asset.url} alt={asset.alt || asset.title} className="h-full w-full object-cover" />
                  ) : (
                    <FileText className="h-10 w-10 text-gray-300" />
                  )}
                </div>
                <div className="space-y-1 p-3">
                  <p className="truncate text-sm font-semibold text-dark" title={asset.title}>
                    {asset.title}
                  </p>
                  <p className="text-[11px] capitalize text-gray-400">
                    {asset.kind} · {asset.folder} · {new Date(asset.createdAt).toLocaleDateString()}
                  </p>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => copyUrl(asset)}
                      className="inline-flex items-center gap-1 rounded border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:border-primary hover:text-primary"
                    >
                      {copiedId === asset.id ? (
                        <>
                          <Check className="h-3 w-3 text-green-600" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" /> Copy URL
                        </>
                      )}
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        title="Delete"
                        aria-label="Delete asset"
                        disabled={busyId !== null}
                        onClick={() => remove(asset)}
                        className="rounded border border-red-200 p-1 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Card>

      {adding && (
        <AddAssetDialog
          canUpload={canUpload}
          canDocuments={canDocuments}
          canLogo={canLogo}
          onClose={() => setAdding(false)}
          onSaved={(asset) => {
            setAdding(false);
            setList((current) => [asset, ...current]);
            notify("Asset added to the library.");
          }}
        />
      )}
    </div>
  );
}

function AddAssetDialog({
  canUpload,
  canDocuments,
  canLogo,
  onClose,
  onSaved,
}: {
  canUpload: boolean;
  canDocuments: boolean;
  canLogo: boolean;
  onClose: () => void;
  onSaved: (asset: MediaAssetRow) => void;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [source, setSource] = useState<"device" | "url">("device");
  const [kind, setKind] = useState("image");
  const [folder, setFolder] = useState("general");
  const [alt, setAlt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!url) {
      setError("Upload a file or paste a URL first.");
      return;
    }
    setSaving(true);
    setError(null);
    const response = await fetch("/api/portal/media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, url, kind, folder, alt }),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setError(data.error ?? "Unable to add the asset.");
      return;
    }
    onSaved(data.asset);
  }

  const kindOptions = [
    { value: "image", label: "Image", allowed: canUpload },
    { value: "document", label: "Document", allowed: canDocuments },
    { value: "logo", label: "Logo / brand", allowed: canLogo },
  ].filter((option) => option.allowed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="flex items-center gap-2 font-heading text-base font-bold text-dark">
            <Shapes className="h-4 w-4 text-primary" /> Add asset
          </h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-700" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-4 px-6 py-5">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">Title</span>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Penthouse hero shot" />
          </label>
          <div>
            <div className="mb-2 inline-flex rounded-lg bg-gray-100 p-1">
              {(["device", "url"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSource(value)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                    source === value ? "bg-white text-primary shadow-sm" : "text-gray-500 hover:text-dark"
                  )}
                >
                  {value === "device" ? "Upload from device" : "Paste a URL"}
                </button>
              ))}
            </div>

            {source === "device" ? (
              <FileUpload
                accept={kind === "document" ? "image/*,application/pdf" : "image/*"}
                onError={(text) => setError(text)}
                onUploaded={(file) => {
                  setError(null);
                  setUrl(file.url);
                  if (!title) setTitle(file.fileName.replace(/\.[^.]+$/, ""));
                }}
              />
            ) : (
              <Input required type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
            )}

            {source === "device" && url && (
              <p className="mt-2 truncate text-[11px] text-green-700">Uploaded · {url}</p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">Kind</span>
              <select
                className="h-12 w-full rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                value={kind}
                onChange={(e) => setKind(e.target.value)}
              >
                {kindOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">Folder</span>
              <Input value={folder} onChange={(e) => setFolder(e.target.value)} placeholder="general" />
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">Alt text (optional)</span>
            <Input value={alt} onChange={(e) => setAlt(e.target.value)} />
          </label>
          {(kind === "image" || kind === "logo") && url && (
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Preview" className="mx-auto max-h-40 rounded object-contain" />
            </div>
          )}
          <p className="flex items-start gap-2 text-[11px] text-gray-400">
            <ImageIcon className="mt-0.5 h-3 w-3 shrink-0" />
            Upload straight from this device, or paste a link to a file already hosted elsewhere. Uploaded files get a
            permanent URL you can reuse in listings and CMS content.
          </p>
        </div>

        {error && <p className="border-t border-red-100 bg-red-50 px-6 py-2 text-sm text-red-700">{error}</p>}

        <footer className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add asset
          </Button>
        </footer>
      </form>
    </div>
  );
}
