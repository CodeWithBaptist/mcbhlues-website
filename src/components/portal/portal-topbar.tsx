"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronRight, ExternalLink, Loader2, LogOut } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useSession } from "./permission-provider";
import { NotificationBell } from "./notification-bell";
import { PortalThemeToggle } from "@/components/theme/portal-theme-toggle";

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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // The account menu opens on click *and* keyboard. Hover alone leaves keyboard
  // and touch users with no way in, so it is a real disclosure.
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  // Close the menu when navigating away from the page it was opened on
  // (adjust state during render, per the React guidance for derived state).
  const [menuPathname, setMenuPathname] = useState(pathname);
  if (menuPathname !== pathname) {
    setMenuPathname(pathname);
    setMenuOpen(false);
  }

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
          <nav className="flex items-center gap-1 text-xs text-gray-500" aria-label="Breadcrumb">
            <Link
              href="/portal"
              className="rounded transition-colors duration-200 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Portal
            </Link>
            {crumbs.map((crumb, index) => (
              <span key={crumb.href} className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3 text-gray-300" aria-hidden="true" />
                {index === crumbs.length - 1 ? (
                  <span className="font-medium text-gray-700" aria-current="page">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="rounded transition-colors duration-200 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <PortalThemeToggle />
          <Link
            href="/"
            target="_blank"
            className="hidden items-center gap-1.5 rounded-md px-3 py-2 text-sm text-gray-600 transition-colors duration-200 hover:bg-gray-50 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:inline-flex"
          >
            View website
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <NotificationBell />

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="Account menu"
              className={cn(
                "group flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors duration-200 hover:bg-gray-100",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                menuOpen && "bg-gray-100"
              )}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark text-sm font-bold text-white ring-2 ring-white transition-transform duration-200 ease-soft group-hover:scale-105">
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

            <div
              role="menu"
              aria-label="Account"
              className={cn(
                "absolute right-0 top-full z-40 w-56 origin-top-right rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl",
                "transition-[opacity,transform,visibility] duration-200 ease-soft",
                menuOpen
                  ? "visible translate-y-1 scale-100 opacity-100"
                  : "invisible translate-y-0 scale-95 opacity-0"
              )}
            >
              <div className="border-b border-gray-100 px-3 py-2">
                <p className="truncate text-sm font-semibold text-dark">{user.email}</p>
                <p className="text-[11px] text-gray-500">
                  {user.permissions.length} effective permissions
                </p>
              </div>
              <Link
                href="/portal/account/password"
                role="menuitem"
                className="block rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors duration-200 hover:bg-gray-50 hover:text-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
              >
                Change password
              </Link>
              <Link
                href="/portal/notifications"
                role="menuitem"
                className="block rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors duration-200 hover:bg-gray-50 hover:text-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
              >
                Notifications
              </Link>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <LogOut className="h-4 w-4" aria-hidden="true" />}
            <span className="hidden sm:inline">{busy ? "Signing out..." : "Sign out"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
