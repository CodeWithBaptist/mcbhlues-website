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
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  // Quiet elevation once the page scrolls underneath the sticky bar. Class-driven
  // so scrolling never re-renders the topbar.
  useEffect(() => {
    const node = headerRef.current;
    if (!node) return;
    let ticking = false;
    const update = () => {
      node.classList.toggle("is-scrolled", window.scrollY > 4);
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Find a portal section shortcut — focus topbar search
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
    <header ref={headerRef} className="portal-topbar sticky top-0 z-30 border-b border-gray-200 bg-white">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 pl-16 sm:gap-4 lg:px-6 xl:px-8">
        {/* Left: breadcrumbs + title */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-heading text-sm font-semibold text-dark">{currentLabel}</p>
          </div>

          <nav className="mt-1 flex flex-wrap items-center gap-1 text-xs text-gray-500" aria-label="Breadcrumb">
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

        {/* Section shortcuts — one input shared by desktop and mobile */}
        <div className="relative order-last w-full lg:order-none lg:w-52 xl:w-64">
          <label className="group relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-primary" />
            <input
              ref={searchRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Find a portal section…"
              aria-label="Find a portal section"
              className="h-11 w-full rounded-md border border-gray-200 bg-gray-50/80 py-2 pl-9 pr-[72px] text-sm text-dark placeholder:text-gray-400 transition-all hover:border-gray-300 hover:bg-white focus:border-primary/30 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
            <span className="pointer-events-none absolute right-1.5 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md bg-white px-2 py-1 text-[11px] font-medium leading-none text-gray-500 shadow-sm ring-1 ring-gray-200 sm:inline-flex">
              <Command className="h-3 w-3" />K
            </span>
          </label>

          {/* Existing section suggestions */}
          {showSearchResults && (
            <div className="portal-menu-enter absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-md border border-gray-200 bg-white p-2 shadow-xl">
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
          <PortalThemeToggle />
          <Link href="/" target="_blank" className="hidden min-h-11 items-center gap-2 px-2 text-sm font-medium text-gray-600 transition-colors hover:text-primary xl:inline-flex">
            Website <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
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
                "group flex min-h-11 items-center gap-2 rounded-md border border-transparent bg-white py-1 px-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                menuOpen
                  ? "border-gray-200 bg-gray-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                {initials}
              </span>
              <span className="hidden text-left 2xl:block">
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
                "absolute right-0 top-full z-40 mt-2 w-72 origin-top-right overflow-hidden rounded-lg border border-gray-200 bg-white shadow-soft",
                "transition-[opacity,transform,visibility] duration-200 ease-soft",
                menuOpen
                  ? "visible translate-y-0 scale-100 opacity-100"
                  : "pointer-events-none invisible -translate-y-1 scale-95 opacity-0"
              )}
            >
              <div className="border-b border-gray-200 bg-gray-50 p-4 text-dark">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                    {initials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold leading-tight">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="truncate text-xs text-gray-500">{user.email}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {user.roles.slice(0, 2).map((role) => (
                        <span
                          key={role.key}
                          className="text-xs text-gray-500"
                        >
                          {role.name}
                        </span>
                      ))}
                      {user.roles.length > 2 && (
                        <span className="text-xs text-gray-500">
                          +{user.roles.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <KeyRound className="h-3 w-3" />
                    {user.permissions.length} permissions
                  </span>

                </div>
              </div>

              <div className="p-2">
                <Link
                  href="/portal/account/password"
                  role="menuitem"
                  className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
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
                  className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Bell className="h-4 w-4" />
                  </span>
                  Notifications
                </Link>
                <Link
                  href="/"
                  target="_blank"
                  role="menuitem"
                  className="flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
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
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-600 hover:text-white hover:border-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
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
            className="hidden min-h-11 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 xl:inline-flex"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
            <span className="hidden xl:inline">{busy ? "Signing out…" : "Sign out"}</span>
          </button>
        </div>
      </div>

    </header>
  );
}
