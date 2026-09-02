"use client";

import { useState } from "react";
import { Loader2, Send, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Lets the signed-in admin email themselves to verify the SMTP credentials
 * saved under System Settings before trusting them with customer mail.
 */
export function TestEmailButton() {
  const [state, setState] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function sendTest() {
    setBusy(true);
    setState(null);
    try {
      const response = await fetch("/api/portal/settings/email-test", { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (data?.result?.status === "sent") {
        setState({ tone: "ok", text: "Test email sent — check your inbox (and spam folder)." });
      } else if (data?.result?.status === "queued") {
        setState({
          tone: "error",
          text: "Nothing was sent yet — fill in the SMTP fields below and save first.",
        });
      } else {
        setState({
          tone: "error",
          text: data?.error ?? data?.result?.error ?? "The test email could not be delivered.",
        });
      }
    } catch {
      setState({ tone: "error", text: "The test request failed — try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button variant="outline" size="sm" onClick={sendTest} disabled={busy}>
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
        Send me a test email
      </Button>
      {state && (
        <p
          className={`flex items-start gap-1.5 text-xs ${
            state.tone === "ok" ? "text-green-700" : "text-red-600"
          }`}
        >
          {state.tone === "ok" ? (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          )}
          <span>{state.text}</span>
        </p>
      )}
    </div>
  );
}
