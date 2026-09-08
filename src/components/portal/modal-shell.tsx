"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared shell for the portal's centered dialogs and right-hand drawers.
 *
 * The editors keep their exact markup — the shell only owns the backdrop, the
 * exit choreography and the focus contract:
 *
 * - Escape dismisses (with the exit animation, not instantly).
 * - Closing plays a ~170ms fade/slide before `onClose` unmounts.
 * - Tab cycles inside the dialog; focus returns to the trigger on close.
 * - The page behind cannot scroll while open.
 * - The panel gets `role="dialog"` semantics without touching every form.
 *
 * `children` is a render prop so the inner Cancel/Close buttons dismiss
 * *through* the shell (`close`) instead of bypassing the exit animation.
 *
 * Reduced motion skips the exit delay entirely — the dialog still closes, it
 * just doesn't animate on the way out.
 */

const EXIT_MS = 170;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

interface ShellProps {
  onClose: () => void;
  /** Accessible name for the dialog, usually its heading. */
  label: string;
  children: (close: () => void) => React.ReactNode;
  className?: string;
}

function useShell({ onClose, label }: { onClose: () => void; label: string }) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);
  // Latest close callback without re-subscribing the Escape listener, which
  // parents invalidate on every render with inline closures.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });
  const timer = useRef<number | null>(null);

  const requestClose = useCallback(() => {
    if (prefersReducedMotion()) {
      onCloseRef.current();
      return;
    }
    // Guarded so double-clicks and Escape-during-exit don't stack timers.
    setClosing((was) => {
      if (!was) timer.current = window.setTimeout(() => onCloseRef.current(), EXIT_MS);
      return true;
    });
  }, []);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    []
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [requestClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // The panel is always the shell's single child (the editor's form or the
    // drawer's panel div). Labelling it imperatively keeps every editor's
    // markup untouched.
    const panel = backdropRef.current?.firstElementChild as HTMLElement | null;
    if (panel) {
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-modal", "true");
      panel.setAttribute("aria-label", label);
      if (!panel.hasAttribute("tabindex")) panel.setAttribute("tabindex", "-1");
      panel.focus({ preventScroll: true });
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [label]);

  // Keep Tab cycling inside the dialog while it is open.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      const root = backdropRef.current;
      if (!root) return;
      const controls = root.querySelectorAll<HTMLElement>(
        'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
      );
      const visible = Array.from(controls).filter((el) => el.getClientRects().length > 0);
      if (visible.length === 0) {
        event.preventDefault();
        return;
      }
      const first = visible[0];
      const last = visible[visible.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return { backdropRef, closing, requestClose };
}

export function ModalShell({
  onClose,
  label,
  align = "start",
  className,
  children,
}: ShellProps & { align?: "start" | "center" }) {
  const { backdropRef, closing, requestClose } = useShell({ onClose, label });
  return (
    <div
      ref={backdropRef}
      className={cn(
        "portal-modal-backdrop fixed inset-0 z-50 flex bg-black/40 p-4",
        align === "start" ? "items-start justify-center overflow-y-auto" : "items-center justify-center",
        closing && "is-closing",
        className
      )}
    >
      {children(requestClose)}
    </div>
  );
}

export function DrawerShell({ onClose, label, className, children }: ShellProps) {
  const { backdropRef, closing, requestClose } = useShell({ onClose, label });
  return (
    <div
      ref={backdropRef}
      className={cn(
        "portal-modal-backdrop fixed inset-0 z-50 flex justify-end bg-black/40",
        closing && "is-closing",
        className
      )}
    >
      {children(requestClose)}
    </div>
  );
}
