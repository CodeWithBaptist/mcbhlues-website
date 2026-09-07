"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cloudflare Turnstile widget (explicit render).
 *
 * Renders nothing at all when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is unset, so an
 * unconfigured deployment shows a normal form and the API falls back to the
 * honeypot + rate limiter. See lib/security/turnstile.ts for the server half.
 */

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (
    element: HTMLElement,
    options: {
      sitekey: string;
      callback?: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
      "timeout-callback"?: () => void;
      theme?: "light" | "dark" | "auto";
      action?: string;
      appearance?: "always" | "execute" | "interaction-only";
    }
  ) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Turnstile is browser-only"));
  }
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`
    );
    const script = existing ?? document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener(
      "error",
      () => {
        scriptPromise = null;
        reject(new Error("Failed to load Turnstile"));
      },
      { once: true }
    );
    if (!existing) document.head.appendChild(script);
  });

  return scriptPromise;
}

/** True when the site key is configured, i.e. the widget will be shown. */
export function isTurnstileEnabled(): boolean {
  return Boolean(SITE_KEY);
}

interface TurnstileProps {
  /** Called with the solved token, or `""` when it expires / errors. */
  onToken: (token: string) => void;
  /** Label recorded in the Cloudflare dashboard. */
  action?: string;
  /** Increment to force a fresh challenge (e.g. after a submit). */
  resetSignal?: number;
  className?: string;
}

export function Turnstile({
  onToken,
  action = "enquiry",
  resetSignal = 0,
  className,
}: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!SITE_KEY) return;
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        // Guard against React 18/19 StrictMode double-invoking the effect.
        if (widgetIdRef.current !== null) return;

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          action,
          theme: "auto",
          callback: (token) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(""),
          "timeout-callback": () => onTokenRef.current(""),
          "error-callback": () => onTokenRef.current(""),
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      const id = widgetIdRef.current;
      widgetIdRef.current = null;
      if (id && window.turnstile) {
        try {
          window.turnstile.remove(id);
        } catch {
          /* widget already gone */
        }
      }
    };
    // `action` is a constant per form; re-rendering the widget on change is
    // intentional and cheap.
  }, [action]);

  useEffect(() => {
    if (resetSignal === 0) return;
    const id = widgetIdRef.current;
    if (id && window.turnstile) {
      try {
        window.turnstile.reset(id);
        onTokenRef.current("");
      } catch {
        /* nothing to reset */
      }
    }
  }, [resetSignal]);

  if (!SITE_KEY) return null;

  return (
    <div className={className}>
      <div ref={containerRef} />
      {failed && (
        <p className="text-sm text-gray-600">
          The security check could not load. You can still send your message —
          we screen submissions on our side.
        </p>
      )}
    </div>
  );
}
