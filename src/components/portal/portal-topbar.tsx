"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
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
  X,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { PortalNavGroup } from "@/lib/rbac/navigation";
import { useSession } from "./permission-provider";
import { NotificationBell } from "./notification-bell";
import { PortalThemeToggle } from "@/components/theme/portal-theme-toggle";

function labelFor(segment: string): string {
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const MENU_ITEM_CLASS =
  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-50 hover:text-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary";

export function PortalTopbar({ navigation = [] }: { navigation?: PortalNavGroup[] }) {
  const { user } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const searchWrapRef = useRef<HTMLDivElement>(null);
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

  // ⌘K / Ctrl+K focuses the section finder unless the sidebar's own filter is
  // already focused (the expanded sidebar claims the shortcut first).
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

  // Section results close on outside click or Escape, like the account menu.
  const showSearchResults = searchQuery.trim().length > 0;
  useEffect(() => {
    if (!showSearchResults) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!searchWrapRef.current?.contains(event.target as Node)) setSearchQuery("");
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSearchQuery("");
        searchRef.current?.blur();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [showSearchResults]);

  // Close the menu and clear the finder when navigating away from the page
  // they were opened on (adjust state during render, per the React guidance
  // for derived state).
  const [menuPathname, setMenuPathname] = useState(pathname);
  if (menuPathname !== pathname) {
    setMenuPathname(pathname);
    setMenuOpen(false);
    setSearchQuery("");
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

  // The finder searches the sections this user is actually allowed to open —
  // the same permission-filtered navigation the sidebar renders.
  const sections = useMemo(
    () => navigation.flatMap((group) => group.items.map((item) => ({ ...item, group: group.group }))),
    [navigation]
  );
  const results = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return sections
      .filter((item) => item.label.toLowerCase().includes(q) || item.group.toLowerCase().includes(q))
      .slice(0, 6);
  }, [sections, searchQuery]);

  return (
    <header ref={headerRef} className="portal-topbar sticky top-0 z-30 border-b border-gray-200 bg-white">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 pl-16 sm:gap-4 lg:px-6 lg:pl-6 xl:px-8">
        {/* Left: current page + breadcrumbs */}
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-sm font-semibold text-dark">{currentLabel}</p>

          <nav className="mt-1 flex flex-wrap items-center gap-1 text-xs text-gray-500" aria-label="Breadcrumb">
            <Link
              href="/portal"
              className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 font-medium transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Home className="h-3 w-3" aria-hidden="true" />
              <span className="hidden sm:inline">Portal</span>
            </Link>
            {crumbs.map((crumb, index) => (
              <span key={crumb.href} className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3 shrink-0 text-gray-400" aria-hidden="true" />
                {index === crumbs.length - 1 ? (
                  <span className="truncate font-semibold text-gray-800" aria-current="page">
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="hidden truncate rounded-md px-1 py-0.5 transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:inline"
                  >
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>
        </div>

        {/* Section finder — one input shared by desktop and mobile */}
        {sections.length > 0 && (
          <div ref={searchWrapRef} className="relative order-last w-full lg:order-none lg:w-56 xl:w-64">
            <label className="group relative block">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-primary"
                aria-hidden="true"
              />
              <input
                ref={searchRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Go to section…"
                aria-label="Find a portal section"
                aria-controls="portal-section-results"
                autoComplete="off"
                className="h-11 w-full rounded-md border border-gray-200 bg-gray-50 py-2 pl-9 pr-16 text-sm text-dark transition-[border-color,background-color,box-shadow] duration-200 placeholder:text-gray-500 hover:border-gray-300 focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10 [&::-webkit-search-cancel-button]:hidden"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[11px] font-medium leading-none text-gray-500 sm:inline-flex">
                <Command className="h-3 w-3" aria-hidden="true" />K
              </span>
            </label>

            {showSearchResults && (
              <div
                id="portal-section-results"
                role="region"
                aria-label="Matching sections"
                aria-live="polite"
                className="portal-menu-enter absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-lg border border-gray-200 bg-white p-1.5 shadow-soft"
              >
                {results.length > 0 ? (
                  <ul className="space-y-0.5">
                    {results.map((item) => (
                      <li key={item.key}>
                        <Link
                          href={item.href}
                          onClick={() => setSearchQuery("")}
                          className="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-sm text-gray-700 transition-colors duration-200 hover:bg-gray-50 hover:text-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
                        >
                          <span className="truncate font-medium">{item.label}</span>
                          <span className="shrink-0 text-xs text-gray-500">{item.group}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-3 py-2 text-sm text-gray-500">No section matches “{searchQuery.trim()}”.</p>
                )}
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="sr-only"
                  aria-label="Close search"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Right actions */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <PortalThemeToggle />
          <NotificationBell />

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="Account menu"
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-md border px-2 py-1 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                menuOpen ? "border-gray-300 bg-gray-50" : "border-gray-200 bg-white hover:border-gray-300"
              )}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
                {initials}
              </span>
              <span className="hidden text-left 2xl:block">
                <span className="block max-w-[10rem] truncate text-sm font-semibold leading-none text-dark">
                  {user.firstName} {user.lastName}
                </span>
                <span className="mt-1 block max-w-[10rem] truncate text-[11px] font-medium leading-none text-gray-500">
                  {user.roles.map((role) => role.name).join(" · ") || "No role"}
                </span>
              </span>
              <ChevronRight
                className={cn(
                  "hidden h-3.5 w-3.5 text-gray-500 transition-transform duration-200 md:block",
                  menuOpen && "rotate-90"
                )}
                aria-hidden="true"
              />
            </button>

            <div
              role="menu"
              aria-label="Account"
              className={cn(
                "absolute right-0 top-full z-40 mt-2 w-72 origin-top-right overflow-hidden rounded-lg border border-gray-200 bg-white shadow-soft",
                "transition-[opacity,transform,visibility] duration-200 ease-soft",
                menuOpen
                  ? "visible translate-y-0 opacity-100"
                  : "pointer-events-none invisible -translate-y-1 opacity-0"
              )}
            >
              <div className="border-b border-gray-200 px-4 py-3.5">
                <p className="truncate text-sm font-semibold text-dark">
                  {user.firstName} {user.lastName}
                </p>
                <p className="truncate text-xs text-gray-500">{user.email}</p>
                {user.roles.length > 0 && (
                  <p className="mt-1.5 truncate text-xs text-gray-500">
                    {user.roles.map((role) => role.name).join(" · ")}
                  </p>
                )}
              </div>

              <div className="p-1.5">
                <Link href="/portal/account/password" role="menuitem" className={MENU_ITEM_CLASS}>
                  <KeyRound className="h-4 w-4 text-gray-500" aria-hidden="true" />
                  Change password
                </Link>
                <Link href="/portal/notifications" role="menuitem" className={MENU_ITEM_CLASS}>
                  <Bell className="h-4 w-4 text-gray-500" aria-hidden="true" />
                  Notifications
                </Link>
                <Link href="/" target="_blank" role="menuitem" className={MENU_ITEM_CLASS}>
                  <ExternalLink className="h-4 w-4 text-gray-500" aria-hidden="true" />
                  View public website
                </Link>
              </div>

              <div className="border-t border-gray-200 p-1.5">
                <button
                  type="button"
                  role="menuitem"
                  onClick={logout}
                  disabled={busy}
                  className={cn(MENU_ITEM_CLASS, "w-full text-red-700 hover:bg-red-50 hover:text-red-700 disabled:opacity-50")}
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                  )}
                  {busy ? "Signing out…" : "Sign out"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
