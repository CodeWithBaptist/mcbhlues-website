"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LockKeyhole, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const IDLE_LIMIT = 20 * 60 * 1000;
const WARNING_LENGTH = 2 * 60 * 1000;

/** Client-side idle lock layered on top of the server session expiry. */
export function SecurityTimeout() {
  const router = useRouter();
  const [warning, setWarning] = useState(false);
  const [remaining, setRemaining] = useState(WARNING_LENGTH);
  // Seeded in the mount effect (not during render) so the component stays
  // pure; `0` simply means "no activity recorded yet".
  const lastActivity = useRef(0);
  const warningRef = useRef(false);

  const signOut = useCallback(async () => {
    await fetch("/api/portal/auth/logout", { method: "POST" });
    router.replace("/portal/login?reason=timeout");
    router.refresh();
  }, [router]);

  const staySignedIn = useCallback(() => {
    lastActivity.current = Date.now();
    warningRef.current = false;
    setWarning(false);
    setRemaining(WARNING_LENGTH);
  }, []);

  useEffect(() => {
    lastActivity.current = Date.now();
    const markActivity = () => {
      if (!warningRef.current) lastActivity.current = Date.now();
    };
    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((event) => window.addEventListener(event, markActivity, { passive: true }));

    const timer = window.setInterval(() => {
      const idleFor = Date.now() - lastActivity.current;
      if (!warningRef.current && idleFor >= IDLE_LIMIT) {
        warningRef.current = true;
        setWarning(true);
        setRemaining(WARNING_LENGTH);
      } else if (warningRef.current) {
        const next = Math.max(0, WARNING_LENGTH - (idleFor - IDLE_LIMIT));
        setRemaining(next);
        if (next === 0) void signOut();
      }
    }, 1000);

    return () => {
      events.forEach((event) => window.removeEventListener(event, markActivity));
      window.clearInterval(timer);
    };
  }, [signOut]);

  if (!warning) return null;
  const seconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = String(seconds % 60).padStart(2, "0");

  return (
    <div
      className="portal-modal-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="timeout-title"
      aria-describedby="timeout-copy"
    >
      <div className="portal-modal-panel w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-lift">
        <LockKeyhole className="h-6 w-6 text-primary" aria-hidden="true" />
        <h2 id="timeout-title" className="mt-4 font-heading text-xl font-bold text-dark">
          Your session is about to lock
        </h2>
        <p id="timeout-copy" className="mt-2 text-sm leading-relaxed text-gray-600">
          You have been inactive for 20 minutes. For your security, you will be signed out in{" "}
          <strong className="tabular-nums text-dark" aria-live="polite">
            {minutes}:{secs}
          </strong>
          . Any activity resets the timer.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" size="sm" onClick={() => void signOut()} className="gap-2">
            <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out now
          </Button>
          <Button type="button" size="sm" autoFocus onClick={staySignedIn}>
            Stay signed in
          </Button>
        </div>
      </div>
    </div>
  );
}
