"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
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

  const content = (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-5 py-5">
        <Link href="/portal" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 font-heading text-sm font-black text-white ring-1 ring-white/20">
            M
          </span>
          <span className="min-w-0">
            <p className="truncate font-heading text-sm font-extrabold uppercase tracking-widest text-white">
              MCBHLUES
            </p>
            <p className="flex items-center gap-1.5 text-xs text-blue-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
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
                      className={cn(
                        "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-200",
                        active
                          ? "bg-white/15 font-semibold text-white shadow-sm"
                          : "text-blue-100/80 hover:translate-x-0.5 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-white" />
                      )}
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
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-md bg-primary-dark p-2 text-white shadow-lg lg:hidden"
        aria-label="Open navigation"
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
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="portal-enter absolute inset-y-0 left-0 w-64 bg-gradient-to-b from-primary-dark via-primary-dark to-[#152a63]">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 text-white"
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
