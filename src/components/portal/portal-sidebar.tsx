/* eslint-disable react-hooks/set-state-in-effect -- hydration-safe read from storage after mount */
"use client";

import Link from "next/link";
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

export function PortalSidebar({ navigation }: { navigation: PortalNavGroup[] }) {
  const pathname = usePathname();
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

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
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
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

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div
        className={cn(
          "relative flex shrink-0 items-center gap-3 border-b border-white/10 px-4 py-5",
          collapsed && "justify-center px-2"
        )}
      >
        <Link
          href="/portal"
          className={cn(
            "group flex items-center gap-3 rounded-xl transition-all",
            collapsed ? "justify-center" : "",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          )}
        >
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[13px] font-black tracking-widest text-primary-dark shadow-sm ring-1 ring-white/30 transition-transform duration-300 ease-soft group-hover:scale-[1.03] group-active:scale-[0.98]">
            M
            <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-primary-dark">
              <span className="h-1.5 w-1.5 animate-ping absolute rounded-full bg-emerald-400 opacity-60" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
          </span>
          {!collapsed && (
            <span className="min-w-0 text-left">
              <p className="font-heading text-[13px] font-extrabold uppercase tracking-[0.14em] text-white">
                MCBHLUES
              </p>
              <p className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-blue-200/90">
                Staff Portal
                <span className="hidden rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white/80 ring-1 ring-white/10 sm:inline-flex">
                  v2
                </span>
              </p>
            </span>
          )}
        </Link>

        {/* Desktop collapse toggle — hidden when collapsed? Keep accessible. */}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand (⌘B)" : "Collapse (⌘B)"}
          className={cn(
            "hidden lg:inline-flex h-7 w-7 items-center justify-center rounded-md text-blue-200/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
            collapsed ? "absolute -right-3 top-1/2 -translate-y-1/2 bg-primary-dark border border-white/15 shadow-md" : "ml-auto"
          )}
        >
          {collapsed ? (
            <Icons.ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <Icons.PanelLeftClose className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* Search — only when expanded */}
      {!collapsed && (
        <div className="px-3 pt-3">
          <label className="group relative flex items-center">
            <Icons.Search className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 text-blue-300/60 transition-colors group-focus-within:text-blue-200" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter menu…"
              aria-label="Filter navigation"
              className="h-8 w-full rounded-lg border border-white/10 bg-white/[0.07] py-1 pl-8 pr-16 text-xs font-medium text-white placeholder:text-blue-200/50 backdrop-blur-sm transition-all placeholder:font-normal hover:border-white/15 hover:bg-white/[0.10] focus:border-white/25 focus:bg-white/[0.12] focus:outline-none focus:ring-1 focus:ring-white/20"
            />
            <span className="pointer-events-none absolute right-1.5 hidden items-center gap-0.5 rounded-md border border-white/10 bg-white/10 px-1 py-0.5 text-[10px] font-medium leading-none text-blue-200/70 sm:inline-flex">
              <span className="text-[11px]">⌘</span>K
            </span>
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear filter"
                className="absolute right-8 flex h-5 w-5 items-center justify-center rounded-md text-blue-200/60 hover:bg-white/10 hover:text-white"
              >
                <Icons.X className="h-3 w-3" />
              </button>
            )}
          </label>
          {query && (
            <p className="mt-1.5 px-1 text-[11px] text-blue-200/60">
              {filteredCount} of {totalItems} {filteredCount === 1 ? "item" : "items"}
            </p>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav
        className={cn(
          "portal-scrollbar flex-1 space-y-5 overflow-y-auto py-4",
          collapsed ? "px-2" : "px-3"
        )}
        aria-label="Portal navigation"
      >
        {filteredNav.length === 0 ? (
          <div className="px-2 py-8 text-center">
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-blue-200/70">
              <Icons.SearchX className="h-4 w-4" />
            </div>
            <p className="mt-2 text-xs font-medium text-white">No matches</p>
            <p className="mt-0.5 text-[11px] text-blue-200/60">Try a different term</p>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mt-3 rounded-md bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/15"
            >
              Clear search
            </button>
          </div>
        ) : (
          filteredNav.map((group) => (
            <div key={group.group}>
              {!collapsed && (
                <p className="mb-2 flex items-center gap-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-300/60">
                  <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" aria-hidden />
                  {group.group}
                  <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" aria-hidden />
                </p>
              )}
              {collapsed && <div className="mx-2 mb-2 h-px bg-white/10" aria-hidden />}
              <ul className={cn("space-y-1", collapsed && "space-y-1.5")}>
                {group.items.map((item) => {
                  const active =
                    item.href === "/portal"
                      ? pathname === "/portal"
                      : pathname.startsWith(item.href);
                  const itemEl = (
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      aria-label={collapsed ? item.label : undefined}
                      title={collapsed ? item.label : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 overflow-hidden rounded-lg text-sm transition-all duration-200 ease-soft",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                        collapsed ? "justify-center p-2.5" : "px-3 py-2",
                        active
                          ? "bg-white text-primary-dark shadow-sm shadow-black/10 font-semibold"
                          : "text-blue-100/80 hover:bg-white/[0.09] hover:text-white active:bg-white/[0.06]"
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute left-0 top-1/2 w-0.5 -translate-y-1/2 rounded-r bg-primary transition-all",
                          collapsed ? "hidden" : "",
                          active ? "h-5 opacity-100" : "h-0 opacity-0 group-hover:h-3 group-hover:opacity-30"
                        )}
                      />
                      <Icon
                        name={item.icon}
                        className={cn(
                          "h-[18px] w-[18px] shrink-0 transition-all duration-200",
                          active
                            ? "text-primary"
                            : "text-blue-200/70 group-hover:text-white group-hover:scale-[1.06]",
                          collapsed && active && "scale-110"
                        )}
                      />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      {!collapsed && active && (
                        <Icons.ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 text-primary/60" />
                      )}
                    </Link>
                  );

                  // Wrap with tooltip when collapsed — show label on hover/focus
                  if (collapsed) {
                    return (
                      <li key={item.key} className="group/tooltip relative">
                        {itemEl}
                        <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg ring-1 ring-white/10 group-hover/tooltip:block group-focus-within/tooltip:block">
                          {item.label}
                          <span className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-slate-900" />
                        </span>
                      </li>
                    );
                  }

                  return <li key={item.key}>{itemEl}</li>;
                })}
              </ul>
            </div>
          ))
        )}
      </nav>

      {/* User card */}
      <div
        className={cn(
          "shrink-0 border-t border-white/10 bg-gradient-to-t from-black/10 to-transparent",
          collapsed ? "px-2 py-3" : "px-3 py-4"
        )}
      >
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-xs font-bold text-white shadow-sm ring-1 ring-white/20">
              {initials}
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-[#0e2a63]" />
            </span>
            <span className="h-1 w-1 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]" aria-hidden />
          </div>
        ) : (
          <div className="rounded-xl bg-white/[0.07] p-3 ring-1 ring-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white to-blue-50 text-xs font-bold text-primary-dark ring-1 ring-white/30 shadow-sm">
                {initials}
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold leading-tight text-white">
                  {user.firstName} {user.lastName}
                </p>
                <p className="flex items-center gap-1 truncate text-[11px] font-medium leading-tight text-blue-200/80">
                  <Icons.ShieldCheck className="h-3 w-3 shrink-0 text-emerald-300" />
                  {roleLabel}
                </p>
              </div>
              <span className="hidden h-6 w-6 items-center justify-center rounded-md bg-white/10 text-blue-100 transition-colors hover:bg-white/15 hover:text-white sm:inline-flex">
                <Icons.Ellipsis className="h-3.5 w-3.5" />
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              <Link
                href="/portal/account/password"
                className="flex flex-col items-center gap-1 rounded-lg bg-white/10 px-2 py-2 text-[11px] font-medium text-blue-100 transition-colors hover:bg-white/15 hover:text-white"
              >
                <Icons.KeyRound className="h-3.5 w-3.5" />
                Password
              </Link>
              <Link
                href="/portal/notifications"
                className="flex flex-col items-center gap-1 rounded-lg bg-white/10 px-2 py-2 text-[11px] font-medium text-blue-100 transition-colors hover:bg-white/15 hover:text-white"
              >
                <Icons.Bell className="h-3.5 w-3.5" />
                Alerts
              </Link>
              <Link
                href="/"
                target="_blank"
                className="flex flex-col items-center gap-1 rounded-lg bg-white text-[11px] font-semibold text-primary-dark shadow-sm transition-colors hover:bg-blue-50"
              >
                <Icons.ExternalLink className="h-3.5 w-3.5" />
                Website
              </Link>
            </div>
            <p className="mt-2.5 flex items-center justify-between text-[10px] font-medium tracking-wide text-blue-200/60">
              <span>{user.permissions.length} permissions</span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Online
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-40 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-dark text-white shadow-lg shadow-primary-dark/20 ring-1 ring-white/15 transition-all hover:scale-[1.03] hover:bg-primary active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:hidden"
        aria-label="Open navigation"
        aria-expanded={open}
      >
        <Icons.Menu className="h-5 w-5" />
      </button>

      {/* Desktop sidebar — width animates when collapsed */}
      <aside
        className={cn(
          "hidden shrink-0 lg:block transition-[width] duration-300 ease-soft",
          collapsed ? "w-[72px]" : "w-[272px]"
        )}
        aria-hidden={collapsed ? undefined : undefined}
      >
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-30 flex flex-col overflow-hidden border-r border-white/10 bg-gradient-to-b from-[#0f2a64] via-[#12307a] to-[#0f2863] shadow-[4px_0_24px_rgba(10,18,32,0.16)] transition-[width] duration-300 ease-soft",
            collapsed ? "w-[72px]" : "w-[272px]"
          )}
        >
          {/* subtle grain + glow */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 -left-12 h-64 w-64 rounded-full bg-white/[0.06] blur-3xl" />
            <div className="absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-blue-400/[0.08] blur-3xl" />
          </div>
          <div className="relative flex h-full flex-col">{sidebarContent}</div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="portal-modal-backdrop absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Portal navigation"
            className="portal-modal-panel absolute inset-y-0 left-0 flex w-[300px] max-w-[86vw] flex-col overflow-hidden rounded-r-2xl border-r border-white/10 bg-gradient-to-b from-[#0f2a64] via-[#12307a] to-[#0f2863] shadow-2xl"
          >
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label="Close navigation"
            >
              <Icons.X className="h-4 w-4" />
            </button>
            <div className="relative flex h-full flex-col">{sidebarContent}</div>
          </div>
        </div>
      )}
    </>
  );
}
