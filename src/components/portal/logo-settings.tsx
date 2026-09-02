"use client";

import { useState } from "react";
import { ImageOff, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "./ui";
import { FileUpload, type UploadedFile } from "./file-upload";
import { useSession } from "./permission-provider";

/**
 * Brand logo manager for Portal → Company Settings. Persists the choice to the
 * `company.logo` setting; the public navbar and footer swap their text logo for
 * the uploaded image as soon as it is saved.
 */
export function LogoSettings({ initialLogoUrl }: { initialLogoUrl: string }) {
  const { can } = useSession();
  const editable = can("settings:company");

  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [linkValue, setLinkValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  async function saveLogo(value: string) {
    setSaving(true);
    setMessage(null);
    const response = await fetch("/api/portal/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scope: "company", key: "company.logo", value }),
    });
    const data = await response.json().catch(() => ({}));
    setSaving(false);
    if (!response.ok) {
      setMessage({ tone: "error", text: data.error ?? "Unable to save the logo." });
      return;
    }
    setLogoUrl(value);
    setLinkValue("");
    setMessage({
      tone: "ok",
      text: value
        ? "Logo saved — the navbar and footer on the public site now use it."
        : "Logo removed — the site falls back to the default text logo.",
    });
  }

  function handleUploaded(file: UploadedFile) {
    void saveLogo(file.url);
  }

  function handleUseLink() {
    const url = linkValue.trim();
    if (!url) {
      setMessage({ tone: "error", text: "Paste an image URL first." });
      return;
    }
    void saveLogo(url);
  }

  return (
    <Card
      title="Site logo"
      description="Shown in the navbar and footer of the public website. Requires settings:company."
      actions={
        logoUrl && editable ? (
          <Button size="sm" variant="outline" onClick={() => void saveLogo("")} disabled={saving}>
            <ImageOff className="mr-2 h-4 w-4" />
            Remove logo
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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Live preview on the two backgrounds the logo sits on */}
        <div>
          <span className="mb-1.5 block text-sm font-medium text-gray-700">Preview</span>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <div className="flex h-20 items-center bg-white px-5">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- staff-uploaded asset from /api/uploads
                <img src={logoUrl} alt="Logo preview on light" className="h-10 w-auto max-w-[180px] object-contain" />
              ) : (
                <span className="text-sm text-gray-400">Navbar (light background) — text logo in use</span>
              )}
            </div>
            <div className="flex h-20 items-center bg-dark px-5">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- staff-uploaded asset from /api/uploads
                <img src={logoUrl} alt="Logo preview on dark" className="h-10 w-auto max-w-[180px] object-contain" />
              ) : (
                <span className="text-sm text-gray-500">Footer (dark background) — text logo in use</span>
              )}
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Tip: a PNG or SVG with a transparent background looks best on the dark footer.
          </p>
        </div>

        {/* Pickers */}
        <div className="flex flex-col gap-4">
          <FileUpload
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml"
            label={saving ? "Saving…" : "Upload a logo from your device"}
            hint="JPG, PNG, WebP, GIF, AVIF or SVG · max 6 MB"
            onUploaded={handleUploaded}
            onError={(text) => setMessage({ tone: "error", text })}
            className={!editable ? "pointer-events-none opacity-50" : undefined}
          />

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-gray-700">…or use an image link</span>
            <div className="flex gap-2">
              <Input
                value={linkValue}
                placeholder="https://example.com/logo.png"
                disabled={!editable || saving}
                onChange={(event) => setLinkValue(event.target.value)}
              />
              <Button
                size="sm"
                variant="outline"
                className="h-12 shrink-0"
                disabled={!editable || saving}
                onClick={handleUseLink}
              >
                <Link2 className="mr-2 h-4 w-4" />
                Use link
              </Button>
            </div>
            <span className="text-[11px] text-gray-400">company.logo</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
