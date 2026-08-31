"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { useSession } from "./permission-provider";

export function PortalTopbar() {
  const { user } = useSession();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await fetch("/api/portal/auth/logout", { method: "POST" });
    router.replace("/portal/login");
    router.refresh();
  }

  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-3 pl-16 lg:px-8 lg:pl-8">
        <div className="min-w-0">
          <p className="truncate font-heading text-base font-bold text-dark">Staff Portal</p>
          <p className="truncate text-xs text-gray-500">
            {user.permissions.length} effective permissions
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="hidden rounded-md px-3 py-2 text-sm text-gray-600 hover:text-primary sm:block"
          >
            View website
          </Link>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
            {initials}
          </div>
          <button
            type="button"
            onClick={logout}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">{busy ? "Signing out..." : "Sign out"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
