"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ChevronRight,
  ExternalLink,
  Home,
  Loader2,
  LogOut,
  Search,
  Command,
  Sparkles,
  Bell,
  KeyRound,
} from "lucide-react";
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
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Global search shortcut — focus topbar search
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        const sidebarSearchFocused = document.activeElement?.getAttribute("aria-label") === "Filter navigation";
        if (!sidebarSearchFocused) {
          event.preventDefault();
          searchRef.current?.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
  const currentLabel = crumbs.length > 0 ? crumbs[crumbs.length - 1].label : "Dashboard";

  const showSearchResults = searchQuery.trim().length > 1;

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b backdrop-blur-xl transition-all duration-300",
        scrolled
          ? "border-gray-200/80 bg-white/85 shadow-[0_4px_20px_rgba(15,23,42,0.06)] supports-[backdrop-filter]:bg-white/75"
          : "border-gray-200/60 bg-white/70 shadow-sm"
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3 pl-16 sm:gap-4 lg:px-6 xl:px-8 lg:pl-6">
        {/* Left: breadcrumbs + title */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="hidden h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15 sm:inline-flex">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <h1 className="truncate font-heading text-[15px] font-bold tracking-tight text-dark sm:text-base">
              {currentLabel}
            </h1>
            {crumbs.length === 0 && (
              <span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200 sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live
              </span>
            )}
          </div>

          <nav className="mt-0.5 flex items-center gap-1 text-xs text-gray-500" aria-label="Breadcrumb">
            <Link
              href="/portal"
              className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 font-medium transition-colors hover:bg-gray-50 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Home className="h-3 w-3" />
              <span className="hidden sm:inline">Portal</span>
            </Link>
            {crumbs.map((crumb, index) => (
              <span key={crumb.href} className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3 shrink-0 text-gray-300" aria-hidden="true" />
                {index === crumbs.length - 1 ? (
                  <span className="truncate font-semibold text-gray-800" aria-current="page">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="hidden truncate rounded-md px-1 py-0.5 transition-colors hover:bg-gray-50 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:inline"
                  >
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>
        </div>

        {/* Center: global search — hidden on small screens, visible from md */}
        <div className="relative hidden w-full max-w-[360px] md:block lg:max-w-[420px]">
          <label className="group relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-primary" />
            <input
              ref={searchRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search properties, customers…"
              aria-label="Global search"
              className="h-9 w-full rounded-full border border-gray-200 bg-gray-50/80 py-2 pl-9 pr-[72px] text-sm text-dark placeholder:text-gray-400 transition-all hover:border-gray-300 hover:bg-white focus:border-primary/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
            <span className="pointer-events-none absolute right-1.5 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-full bg-white px-2 py-1 text-[11px] font-medium leading-none text-gray-500 shadow-sm ring-1 ring-gray-200 sm:inline-flex">
              <Command className="h-3 w-3" />K
            </span>
          </label>

          {/* Mock results dropdown */}
          {showSearchResults && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
              <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                Quick suggestions
              </p>
              <div className="space-y-1">
                {[
                  { label: "Go to Properties", href: "/portal/properties", icon: Home },
                  { label: "View Enquiries", href: "/portal/enquiries", icon: Bell },
                  { label: "Open Customers", href: "/portal/customers", icon: Search },
                ]
                  .filter((s) => s.label.toLowerCase().includes(searchQuery.toLowerCase()))
                  .slice(0, 3)
                  .map((s) => (
                    <Link
                      key={s.href}
                      href={s.href}
                      onClick={() => setSearchQuery("")}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary"
                    >
                      <s.icon className="h-4 w-4 text-gray-400" />
                      {s.label}
                    </Link>
                  ))}
                <div className="border-t border-gray-100 pt-2">
                  <p className="px-3 py-1 text-xs text-gray-500">
                    Press <kbd className="rounded border bg-gray-50 px-1 font-mono text-[11px]">Enter</kbd> to
                    search all records
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-2 rounded-md p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                aria-label="Close search"
              >
                ×
              </button>
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Mobile search button */}
          <button
            type="button"
            onClick={() => searchRef.current?.focus()}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:hidden"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>

          <div className="hidden sm:flex items-center gap-1.5">
            <PortalThemeToggle />
            <Link
              href="/"
              target="_blank"
              className="hidden items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-all hover:border-primary/20 hover:bg-primary hover:text-white hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lg:inline-flex xl:px-3.5"
            >
              <span className="hidden xl:inline">View website</span>
              <span className="xl:hidden">Website</span>
              <ExternalLink className="h-3 w-3 opacity-70" aria-hidden="true" />
            </Link>
          </div>

          <span className="hidden h-6 w-px bg-gray-200 sm:block" aria-hidden />

          <NotificationBell />

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="Account menu"
              className={cn(
                "group flex items-center gap-2 rounded-full border bg-white py-1 pl-1 pr-2 shadow-sm transition-all hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                menuOpen
                  ? "border-primary/20 bg-primary/[0.04] shadow-md"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark text-xs font-bold text-white shadow-sm ring-1 ring-white transition-transform duration-200 ease-soft group-hover:scale-[1.03]">
                {initials}
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </span>
              <span className="hidden text-left md:block">
                <span className="block max-w-[10rem] truncate text-sm font-semibold leading-none text-dark">
                  {user.firstName} {user.lastName}
                </span>
                <span className="block max-w-[10rem] truncate text-[11px] font-medium leading-none text-gray-500">
                  {user.roles.map((role) => role.name).join(" · ") || "No role"}
                </span>
              </span>
              <ChevronRight
                className={cn(
                  "hidden h-3.5 w-3.5 text-gray-400 transition-transform md:block",
                  menuOpen && "rotate-90"
                )}
              />
            </button>

            <div
              role="menu"
              aria-label="Account"
              className={cn(
                "absolute right-0 top-full z-40 mt-2 w-72 origin-top-right overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl ring-1 ring-black/5",
                "transition-[opacity,transform,visibility] duration-200 ease-soft",
                menuOpen
                  ? "visible translate-y-0 scale-100 opacity-100"
                  : "pointer-events-none invisible -translate-y-1 scale-95 opacity-0"
              )}
            >
              <div className="bg-gradient-to-br from-primary-dark via-primary to-primary-light p-4 text-white">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-bold ring-1 ring-white/20 backdrop-blur">
                    {initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold leading-tight">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="truncate text-xs text-blue-100">{user.email}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {user.roles.slice(0, 2).map((role) => (
                        <span
                          key={role.key}
                          className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold leading-none ring-1 ring-white/20"
                        >
                          {role.name}
                        </span>
                      ))}
                      {user.roles.length > 2 && (
                        <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold leading-none ring-1 ring-white/20">
                          +{user.roles.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-blue-100">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 ring-1 ring-white/15">
                    <KeyRound className="h-3 w-3" />
                    {user.permissions.length} permissions
                  </span>
                  <span className="ml-auto flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Active now
                  </span>
                </div>
              </div>

              <div className="p-2">
                <Link
                  href="/portal/account/password"
                  role="menuitem"
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-600">
                    <KeyRound className="h-4 w-4" />
                  </span>
                  Change password
                  <ChevronRight className="ml-auto h-4 w-4 text-gray-300" />
                </Link>
                <Link
                  href="/portal/notifications"
                  role="menuitem"
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Bell className="h-4 w-4" />
                  </span>
                  Notifications
                  <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
                    New
                  </span>
                </Link>
                <Link
                  href="/"
                  target="_blank"
                  role="menuitem"
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-600">
                    <ExternalLink className="h-4 w-4" />
                  </span>
                  View public website
                </Link>
              </div>

              <div className="border-t border-gray-100 p-2">
                <button
                  type="button"
                  onClick={logout}
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-600 hover:text-white hover:border-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                  )}
                  {busy ? "Signing out…" : "Sign out"}
                </button>
                <p className="mt-2 text-center text-[11px] text-gray-400">
                  Signed in as {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Separate sign-out on desktop — now inside menu primary, keep ghost for quick access on xl */}
          <button
            type="button"
            onClick={logout}
            disabled={busy}
            className="hidden h-9 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 xl:inline-flex"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            <span className="hidden xl:inline">{busy ? "Signing out…" : "Sign out"}</span>
          </button>
        </div>
      </div>

      {/* Mobile: inline search row when needed */}
      <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-2 md:hidden">
        <label className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3 h-4 w-4 text-gray-400" />
          <input
            placeholder="Search properties, customers…"
            className="h-9 w-full rounded-full border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-primary/30 focus:outline-none focus:ring-4 focus:ring-primary/10"
          />
        </label>
      </div>
    </header>
  );
}
