"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { useSession } from "./permission-provider";

/**
 * Topbar bell with a live unread badge. Polls on navigation, window focus and
 * a slow interval; clicking through marks the server the moment the user
 * opens the notifications page (client-side there).
 */
export function NotificationBell() {
  const { can } = useSession();
  const pathname = usePathname();
  const [unread, setUnread] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/portal/notifications", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      setUnread(typeof data.unread === "number" ? data.unread : 0);
    } catch {
      // Network hiccup — keep the last known count.
    }
  }, []);

  useEffect(() => {
    if (!can("notification:read")) return;
    // Defer the first fetch so no state update happens synchronously in the effect.
    const initial = setTimeout(() => void refresh(), 0);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    timer.current = setInterval(() => void refresh(), 45_000);
    return () => {
      clearTimeout(initial);
      window.removeEventListener("focus", onFocus);
      if (timer.current) clearInterval(timer.current);
    };
  }, [can, pathname, refresh]);

  if (!can("notification:read")) return null;

  return (
    <Link
      href="/portal/notifications"
      className="group relative flex h-11 w-11 items-center justify-center rounded-md text-gray-500 transition-colors duration-200 hover:bg-gray-100 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      aria-label={unread ? `${unread} unread notifications` : "Notifications"}
      title="Notifications"
    >
      <Bell
        className="h-5 w-5 transition-transform duration-200 ease-soft group-hover:scale-110"
        aria-hidden="true"
      />
      {unread !== null && unread > 0 && (
        /* Re-keyed so the badge pops each time the count changes. */
        <span
          key={unread}
          className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 animate-pop items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white ring-2 ring-white"
          aria-hidden="true"
        >
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
