"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConsent, useHydrated, writeConsent, type ConsentDecision } from "@/lib/consent";

/**
 * Cookie consent banner.
 *
 * No analytics script loads until the visitor accepts — `SiteAnalytics` reads
 * the same store. "Essential only" is given equal visual weight to "Accept
 * all", which is what the NDPA and the GDPR both expect.
 *
 * Reopen it from anywhere with:
 *   `document.dispatchEvent(new Event("mcbhlues:open-cookie-settings"))`
 * (the footer's "Cookie settings" link does exactly that).
 */

const OPEN_EVENT = "mcbhlues:open-cookie-settings";

export function CookieConsent() {
  const consent = useConsent();
  // Never paint on the server: the decision lives in localStorage, so a
  // server-rendered banner would flash for visitors who already answered.
  const hydrated = useHydrated();
  const [reopened, setReopened] = useState(false);

  useEffect(() => {
    const open = () => setReopened(true);
    document.addEventListener(OPEN_EVENT, open);
    return () => document.removeEventListener(OPEN_EVENT, open);
  }, []);

  function decide(decision: ConsentDecision) {
    writeConsent(decision);
    setReopened(false);
  }

  if (!hydrated) return null;
  if (consent !== null && !reopened) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
      className="fixed inset-x-0 bottom-0 z-[70] px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div className="relative mx-auto flex max-w-4xl animate-fade-up flex-col gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-lift sm:p-6 md:flex-row md:items-center md:gap-6">
        <div className="flex flex-1 gap-4">
          <Cookie className="mt-0.5 hidden h-6 w-6 shrink-0 text-primary sm:block" aria-hidden="true" />
          <div className="space-y-1 pr-8 md:pr-0">
            <h2 id="cookie-consent-title" className="text-base font-bold text-dark">
              We value your privacy
            </h2>
            <p id="cookie-consent-description" className="text-sm leading-relaxed text-gray-700">
              We use essential cookies to keep this site working. With your
              permission we also collect anonymous, aggregated usage statistics
              so we can improve it. Read our{" "}
              <Link
                href="/cookies"
                className="font-semibold text-primary underline underline-offset-2 hover:text-primary-dark"
              >
                Cookie&nbsp;Policy
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:flex-row md:flex-col lg:flex-row">
          <Button
            type="button"
            variant="outline"
            className="w-full justify-center whitespace-nowrap sm:w-auto"
            onClick={() => decide("rejected")}
          >
            Essential only
          </Button>
          <Button
            type="button"
            className="w-full justify-center whitespace-nowrap sm:w-auto"
            onClick={() => decide("accepted")}
          >
            Accept all
          </Button>
        </div>

        <button
          type="button"
          aria-label="Dismiss — keep essential cookies only"
          onClick={() => decide("rejected")}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-md text-gray-600 transition-colors duration-200 hover:bg-gray-100 hover:text-dark md:hidden"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/** Footer link that re-opens the banner so a choice can be changed. */
export function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => document.dispatchEvent(new Event(OPEN_EVENT))}
    >
      Cookie settings
    </button>
  );
}
