"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronRight, ExternalLink, Loader2, LogOut } from "lucide-react";
import Link from "next/link";
import { useSession } from "./permission-provider";
import { NotificationBell } from "./notification-bell";

function labelFor(segment: string): string {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function PortalTopbar() {
  const { user } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await fetch("/api/portal/auth/logout", { method: "POST" });
    router.replace("/portal/login");
    router.refresh();
  }

  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

  // /portal/settings/system → Portal › Settings › System
  const segments = pathname.split("/").filter(Boolean).slice(1);
  const crumbs = segments.map((segment, index) => ({
    label: labelFor(segment),
    href: `/portal/${segments.slice(0, index + 1).join("/")}`,
  }));

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 shadow-sm backdrop-blur-md">
      <div className="flex items-center justify-between gap-4 px-4 py-3 pl-16 lg:px-8 lg:pl-8">
        <div className="min-w-0">
          <p className="truncate font-heading text-base font-bold text-dark">
            {crumbs.length > 0 ? crumbs[crumbs.length - 1].label : "Dashboard"}
          </p>
          <nav className="flex items-center gap-1 text-xs text-gray-500">
            <Link href="/portal" className="hover:text-primary">
              Portal
            </Link>
            {crumbs.map((crumb, index) => (
              <span key={crumb.href} className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3 text-gray-300" />
                {index === crumbs.length - 1 ? (
                  <span className="font-medium text-gray-700">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="hover:text-primary">
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            target="_blank"
            className="hidden items-center gap-1.5 rounded-md px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-primary sm:inline-flex"
          >
            View website
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
          <NotificationBell />

          <div className="group relative">
            <button
              type="button"
              className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-gray-100"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark text-sm font-bold text-white ring-2 ring-white">
                {initials}
              </span>
              <span className="hidden text-left md:block">
                <span className="block max-w-[9rem] truncate text-sm font-semibold leading-tight text-dark">
                  {user.firstName} {user.lastName}
                </span>
                <span className="block max-w-[9rem] truncate text-[11px] leading-tight text-gray-500">
                  {user.roles.map((role) => role.name).join(", ") || "No role"}
                </span>
              </span>
            </button>

            <div className="invisible absolute right-0 top-full z-40 w-56 translate-y-1 rounded-xl border border-gray-200 bg-white p-1.5 opacity-0 shadow-xl transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
              <div className="border-b border-gray-100 px-3 py-2">
                <p className="truncate text-sm font-semibold text-dark">{user.email}</p>
                <p className="text-[11px] text-gray-500">{user.permissions.length} effective permissions</p>
              </div>
              <Link
                href="/portal/account/password"
                className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary"
              >
                Change password
              </Link>
              <Link
                href="/portal/notifications"
                className="block rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary"
              >
                Notifications
              </Link>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            <span className="hidden sm:inline">{busy ? "Signing out..." : "Sign out"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
