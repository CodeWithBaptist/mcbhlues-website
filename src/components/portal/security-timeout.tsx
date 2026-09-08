"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, LockKeyhole, LogOut, MousePointer2 } from "lucide-react";
import { useRouter } from "next/navigation";

const IDLE_LIMIT = 20 * 60 * 1000;
const WARNING_LENGTH = 2 * 60 * 1000;

/** Client-side idle lock layered on top of the server session expiry. */
export function SecurityTimeout() {
  const router = useRouter();
  const [warning, setWarning] = useState(false);
  const [remaining, setRemaining] = useState(WARNING_LENGTH);
  const lastActivity = useRef(Date.now());
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
    <div className="portal-modal-backdrop fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="timeout-title">
      <div className="portal-modal-panel w-full max-w-md rounded-2xl border border-amber-200 bg-white p-6 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-200">
          <LockKeyhole className="h-6 w-6" />
        </div>
        <h2 id="timeout-title" className="mt-4 text-xl font-bold text-gray-900">Your session is about to lock</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          You have been inactive for 20 minutes. For your security, you will be signed out in <strong className="text-gray-900">{minutes}:{secs}</strong>.
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => void signOut()} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            <LogOut className="h-4 w-4" /> Sign out now
          </button>
          <button type="button" autoFocus onClick={staySignedIn} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark">
            <MousePointer2 className="h-4 w-4" /> Stay signed in
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-gray-400"><AlertTriangle className="h-3.5 w-3.5" /> Activity resets the security timer.</div>
      </div>
    </div>
  );
}
