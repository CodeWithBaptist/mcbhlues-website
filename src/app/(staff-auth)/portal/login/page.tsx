"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/portal";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/portal/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error ?? "Unable to sign in.");
      setLoading(false);
      return;
    }

    router.replace(next.startsWith("/portal") ? next : "/portal");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="email">
          Work email
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@mcbhlues.com"
          required
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="password">
          Password
        </label>
        <div className="relative">
          <Input
            id="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            className="pr-12"
            required
          />
          <button
            type="button"
            onClick={() => setShow((value) => !value)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {loading ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}

export default function StaffLoginPage() {
  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <h1 className="font-heading text-xl font-bold text-dark">MCBHLUES Staff Portal</h1>
        <p className="mt-1 text-sm text-gray-500">
          Sign in with your staff account. Access is granted by your assigned role.
        </p>
      </div>

      <Suspense fallback={<div className="h-40" />}>
        <LoginForm />
      </Suspense>

      <div className="mt-6 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
        <p className="mb-1 font-semibold text-gray-700">Demo accounts</p>
        <ul className="space-y-0.5">
          <li>superadmin@mcbhlues.com — SuperAdmin@123</li>
          <li>admin@mcbhlues.com — Admin@123</li>
          <li>propertymanager@mcbhlues.com — Property@123</li>
          <li>salesagent@mcbhlues.com — Sales@123</li>
          <li>reception@mcbhlues.com — Reception@123</li>
          <li>contentmanager@mcbhlues.com — Content@123</li>
        </ul>
      </div>
    </div>
  );
}
