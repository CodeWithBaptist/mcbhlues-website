"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface InviteInfo {
  email: string;
  firstName: string;
  lastName: string;
}

export default function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch(`/api/portal/auth/invite?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Invalid invitation.");
        setInvite(data);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSubmitting(true);

    const response = await fetch("/api/portal/auth/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await response.json().catch(() => ({}));
    setSubmitting(false);

    if (!response.ok) {
      setError(data.error ?? "Unable to set your password.");
      return;
    }
    setDone(true);
    setTimeout(() => router.replace("/portal/login"), 1800);
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <KeyRound className="h-6 w-6 text-primary" />
        </div>
        <h1 className="font-heading text-xl font-bold text-dark">Set your password</h1>
        {invite && (
          <p className="mt-1 text-sm text-gray-500">
            Welcome {invite.firstName} — activate {invite.email}
          </p>
        )}
      </div>

      {loading && <p className="text-center text-sm text-gray-500">Checking invitation...</p>}

      {!loading && !invite && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error ?? "This invitation is invalid or has expired."}
        </p>
      )}

      {done && (
        <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Password set. Redirecting you to sign in...
        </p>
      )}

      {!loading && invite && !done && (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="password">
              New password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              At least 10 characters, with upper &amp; lower case, a number and a symbol.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="confirm">
              Confirm password
            </label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              required
            />
          </div>

          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Activate account
          </Button>
        </form>
      )}
    </div>
  );
}
