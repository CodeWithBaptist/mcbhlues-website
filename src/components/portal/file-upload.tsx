"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export interface UploadedFile {
  id: string;
  url: string;
  fileName: string;
  contentType: string;
  byteSize: number;
}

/**
 * Picks a file from the user's device, uploads it to /api/portal/uploads and
 * hands the caller back a URL it can store exactly like a pasted link.
 * Supports drag & drop as well as the normal file dialog.
 */
export function FileUpload({
  onUploaded,
  onError,
  accept = "image/*",
  label = "Upload from device",
  hint,
  className,
  compact = false,
}: {
  onUploaded: (file: UploadedFile) => void;
  onError?: (message: string) => void;
  accept?: string;
  label?: string;
  hint?: string;
  className?: string;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [progressNote, setProgressNote] = useState<string | null>(null);

  async function send(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setProgressNote(files.length > 1 ? `Uploading ${files.length} files…` : "Uploading…");

    for (const file of Array.from(files)) {
      const body = new FormData();
      body.append("file", file);
      try {
        const response = await fetch("/api/portal/uploads", { method: "POST", body });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          onError?.(data.error ?? `Could not upload ${file.name}.`);
          continue;
        }
        onUploaded(data.upload as UploadedFile);
      } catch {
        onError?.(`Could not upload ${file.name}. Check your connection and try again.`);
      }
    }

    setBusy(false);
    setProgressNote(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  if (compact) {
    return (
      <>
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "inline-flex h-12 shrink-0 items-center gap-2 rounded-md border border-gray-200 px-4 text-sm font-medium text-gray-700 transition-colors hover:border-primary hover:text-primary disabled:opacity-50",
            className
          )}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {busy ? "Uploading…" : label}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={(event) => send(event.target.files)}
        />
      </>
    );
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        send(event.dataTransfer.files);
      }}
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors",
        dragging ? "border-primary bg-primary/5" : "border-gray-200 bg-gray-50/60 hover:border-primary/50",
        className
      )}
    >
      {busy ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : (
        <Upload className="h-6 w-6 text-primary" />
      )}
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="text-sm font-semibold text-primary underline-offset-2 hover:underline disabled:opacity-50"
      >
        {busy ? progressNote ?? "Uploading…" : label}
      </button>
      <p className="text-xs text-gray-500">{hint ?? "or drag & drop a file here · max 6 MB"}</p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(event) => send(event.target.files)}
      />
    </div>
  );
}
