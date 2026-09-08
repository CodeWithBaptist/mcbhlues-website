import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** Same shortcuts and destinations, without nested decorative cards. */
export function QuickActions({ actions }: { actions: { label: string; href: string; icon: string }[] }) {
  if (actions.length === 0) return null;
  return (
    <section className="border-b border-gray-200 pb-6">
      <h2 className="font-heading text-base font-bold text-dark">Quick actions</h2>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
        {actions.map((action) => (
          <Link key={action.href + action.label} href={action.href}
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary transition-colors duration-200 hover:text-primary-dark">
            {action.label}<ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}
