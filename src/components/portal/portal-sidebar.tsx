/* eslint-disable react-hooks/set-state-in-effect -- hydration-safe read from storage after mount */
"use client";

import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import type { PortalNavGroup } from "@/lib/rbac/navigation";
import { useSession } from "./permission-provider";

const COLLAPSED_KEY = "mcbhlues-portal-sidebar-collapsed";

function Icon({ name, className }: { name: string; className?: string }) {
  const Resolved = (Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[
    name
  ];
  const Fallback = Icons.Circle;
  const Component = Resolved ?? Fallback;
  return <Component className={className} />;
}

export function PortalSidebar({ navigation, logoUrl, companyName }: { navigation: PortalNavGroup[]; logoUrl?: string | null; companyName?: string }) {
  const pathname = usePathname();
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Persisted collapsed state — desktop only; mobile drawer is always expanded.
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSED_KEY) === "1");
    } catch {
      // storage unavailable (private mode) — keep default
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + B to toggle.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        if (window.innerWidth >= 1024) toggleCollapsed();
      }
      // Focus search with Cmd/Ctrl + K when sidebar is expanded
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        if (window.innerWidth >= 1024 && !collapsed) {
          event.preventDefault();
          searchRef.current?.focus();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [collapsed, toggleCollapsed]);

  // Drawer behaviour: Escape closes, focus starts on the close button, the page
  // behind cannot scroll, and closing hands focus back to the toggle.
  useEffect(() => {
    if (!open) return;

    const toggle = toggleRef.current;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "Tab") {
        const controls = drawerRef.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input');
        const visible = Array.from(controls ?? []).filter((el) => el.getClientRects().length > 0);
        const first = visible[0], last = visible[visible.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    const onResize = () => { if (window.innerWidth >= 1024) setOpen(false); };
    window.addEventListener("resize", onResize);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
      document.body.style.overflow = previousOverflow;
      toggle?.focus();
    };
  }, [open]);

  const filteredNav = useMemo(() => {
    if (!query.trim()) return navigation;
    const q = query.toLowerCase();
    return navigation
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) => item.label.toLowerCase().includes(q) || item.key.toLowerCase().includes(q)
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [navigation, query]);

  const totalItems = navigation.reduce((acc, g) => acc + g.items.length, 0);
  const filteredCount = filteredNav.reduce((acc, g) => acc + g.items.length, 0);
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();
  const roleLabel = user.roles[0]?.name ?? "No role";

  // A collapsed desktop rail must never collapse the mobile drawer.
  const compact = collapsed && !open;
  const sidebarContent = (
    <div className="flex h-full min-h-0 flex-col">
      <div className={cn("shrink-0 border-b border-gray-200 px-5 py-5", compact && "px-2 text-center")}>
        {compact ? (
          <Link href="/portal" aria-label="MCBHLUES Staff Portal" className="block py-2 font-heading text-lg font-bold tracking-tighter text-primary-dark">MCB</Link>
        ) : (
          <>
            <Logo href="/portal" logoUrl={logoUrl} name={companyName} className="w-fit" />
            <p className="mt-3 text-xs font-medium text-gray-500">Staff Portal</p>
          </>
        )}
        <button type="button" onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand (⌘B)" : "Collapse (⌘B)"}
          className={cn("mt-3 hidden min-h-9 items-center justify-center gap-2 rounded-md text-xs text-gray-500 transition-colors hover:text-primary lg:flex", compact ? "w-full" : "w-fit")}>
          {collapsed ? <Icons.PanelLeftOpen className="h-4 w-4" /> : <Icons.PanelLeftClose className="h-4 w-4" />}
          {!compact && "Collapse menu"}
        </button>
      </div>
      {!compact && (
        <div className="px-4 pt-4">
          <label className="relative flex items-center">
            <Icons.Search className="pointer-events-none absolute left-3 h-4 w-4 text-gray-500" />
            <input ref={searchRef} value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter menu…" aria-label="Filter navigation"
              className="h-11 w-full rounded-md border border-gray-200 bg-white pl-9 pr-10 text-sm text-dark placeholder:text-gray-500" />
            {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear filter" className="absolute right-0 flex h-11 w-10 items-center justify-center text-gray-500 hover:text-primary"><Icons.X className="h-4 w-4" /></button>}
          </label>
          {query && <p className="mt-2 text-xs text-gray-500">{filteredCount} of {totalItems} items</p>}
        </div>
      )}
      <nav className={cn("portal-scrollbar min-h-0 flex-1 space-y-5 overflow-x-hidden overflow-y-auto py-5", compact ? "px-2" : "px-4")} aria-label="Portal navigation">
        {filteredNav.length === 0 ? (
          <div className="py-4 text-sm text-gray-500">
            <p>No matches. Try a different term.</p>
            <button type="button" onClick={() => setQuery("")} className="mt-2 min-h-11 font-medium text-primary">Clear search</button>
          </div>
        ) : filteredNav.map((group) => (
          <div key={group.group}>
            {!compact && <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-gray-500">{group.group}</p>}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.href === "/portal" ? pathname === "/portal" : pathname.startsWith(item.href);
                return <li key={item.key}>
                  <Link href={item.href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined}
                    aria-label={compact ? item.label : undefined} title={compact ? item.label : undefined}
                    className={cn("portal-nav-link group flex min-h-11 items-center gap-3 border-l-2 px-3 text-sm font-medium transition-colors duration-200",
                      compact && "justify-center px-2",
                      active ? "border-primary text-primary" : "border-transparent text-gray-600 hover:border-primary/40 hover:text-primary")}>
                    <Icon name={item.icon} className="h-[18px] w-[18px] shrink-0" />
                    {!compact && <span>{item.label}</span>}
                  </Link>
                </li>;
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="shrink-0 border-t border-gray-200 p-4">
        <div className={cn("flex items-center gap-3", compact && "justify-center")}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">{initials}</span>
          {!compact && <div className="min-w-0"><p className="truncate text-sm font-semibold text-dark">{user.firstName} {user.lastName}</p><p className="text-xs text-gray-500">{roleLabel}</p></div>}
        </div>
        {!compact && <>
          <div className="mt-3 flex flex-wrap gap-x-4 text-xs font-medium text-gray-600">
            <Link href="/portal/account/password" onClick={() => setOpen(false)} className="inline-flex min-h-11 items-center hover:text-primary">Password</Link>
            <Link href="/portal/notifications" onClick={() => setOpen(false)} className="inline-flex min-h-11 items-center hover:text-primary">Alerts</Link>
            <Link href="/" target="_blank" className="inline-flex min-h-11 items-center gap-1 hover:text-primary">Website<Icons.ExternalLink className="h-3 w-3" /></Link>
          </div>
          <p className="mt-1 text-xs text-gray-500">{user.permissions.length} permissions</p>
        </>}
      </div>
    </div>
  );

  return <>
    <button ref={toggleRef} type="button" onClick={() => setOpen(true)}
      className="fixed left-3 top-3 z-40 flex h-11 w-11 items-center justify-center rounded-md text-dark transition-colors hover:bg-gray-100 lg:hidden"
      aria-label="Open navigation" aria-expanded={open} aria-controls="portal-mobile-navigation">
      <Icons.Menu className="h-5 w-5" />
    </button>
    <aside className={cn("hidden shrink-0 transition-[width] duration-200 lg:block", collapsed ? "w-[72px]" : "w-[256px]")}>
      <div className={cn("fixed inset-y-0 left-0 z-30 border-r border-gray-200 bg-white transition-[width] duration-200", collapsed ? "w-[72px]" : "w-[256px]")}>
        {sidebarContent}
      </div>
    </aside>
    {open && <div className="fixed inset-0 z-50 lg:hidden">
      <div className="portal-modal-backdrop absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-hidden="true" />
      <div ref={drawerRef} id="portal-mobile-navigation" role="dialog" aria-modal="true" aria-label="Portal navigation"
        className="portal-navigation-panel absolute inset-y-0 left-0 w-[300px] max-w-[88vw] border-r border-gray-200 bg-white">
        <button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label="Close navigation"
          className="absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-md text-gray-500 hover:text-primary"><Icons.X className="h-5 w-5" /></button>
        {sidebarContent}
      </div>
    </div>}
  </>;
}
