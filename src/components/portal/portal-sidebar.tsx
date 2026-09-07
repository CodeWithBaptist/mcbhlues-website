"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";
import type { PortalNavGroup } from "@/lib/rbac/navigation";
import { useSession } from "./permission-provider";

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
  const toggleRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

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

  const content = (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <Link
          href="/portal"
          className="group flex items-center gap-3 rounded-lg transition-opacity duration-200 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 font-heading text-sm font-black text-white ring-1 ring-white/20 transition-transform duration-300 ease-soft group-hover:scale-105">
            M
          </span>
          <span className="min-w-0">
            <p className="truncate font-heading text-sm font-extrabold uppercase tracking-widest text-white">
              MCBHLUES
            </p>
            <p className="flex items-center gap-1.5 text-xs text-blue-200">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              Staff Portal
            </p>
          </span>
        </Link>
      </div>

      <nav className="portal-scrollbar flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {navigation.map((group) => (
          <div key={group.group}>
            <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-widest text-blue-300/70">
              {group.group}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active =
                  item.href === "/portal"
                    ? pathname === "/portal"
                    : pathname.startsWith(item.href);
                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 overflow-hidden rounded-md px-3 py-2 text-sm transition-all duration-200 ease-soft",
                        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white",
                        active
                          ? "bg-white/15 font-semibold text-white shadow-sm"
                          : "text-blue-100/80 hover:translate-x-0.5 hover:bg-white/10 hover:text-white active:translate-x-0"
                      )}
                    >
                      {/* Left rail that grows into place on the current page. */}
                      <span
                        aria-hidden="true"
                        className={cn(
                          "absolute left-0 top-1/2 w-1 -translate-y-1/2 rounded-r bg-white transition-all duration-300 ease-soft",
                          active ? "h-5 opacity-100" : "h-0 opacity-0 group-hover:h-3 group-hover:opacity-40"
                        )}
                      />
                      <Icon
                        name={item.icon}
                        className={cn(
                          "h-4 w-4 shrink-0 transition-transform duration-200",
                          active ? "scale-110" : "group-hover:scale-110"
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-xs font-bold text-white ring-1 ring-white/20">
            {`${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-xs text-blue-200">
              {user.roles.map((role) => role.name).join(", ") || "No role assigned"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={toggleRef}
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-md bg-primary-dark p-2 text-white shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:hidden"
        aria-label="Open navigation"
        aria-expanded={open}
      >
        <Icons.Menu className="h-5 w-5" />
      </button>

      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-primary-dark via-primary-dark to-[#152a63]">
          {content}
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="portal-modal-backdrop absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Portal navigation"
            className="portal-modal-panel absolute inset-y-0 left-0 w-64 bg-gradient-to-b from-primary-dark via-primary-dark to-[#152a63]"
          >
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 rounded-md p-1 text-white transition-colors hover:bg-white/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              aria-label="Close navigation"
            >
              <Icons.X className="h-5 w-5" />
            </button>
            {content}
          </div>
        </div>
      )}
    </>
  );
}
