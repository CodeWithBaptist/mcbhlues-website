import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

/** Existing metrics, expressed as quiet typographic summaries rather than tiles. */
export function StatCard({ label, value, hint, href }: {
  label: string;
  value: string;
  hint?: string;
  icon: string;
  tone?: "primary" | "emerald" | "amber" | "violet" | "sky" | "rose" | "slate";
  href?: string;
}) {
  const content = <>
    <div className="flex items-start justify-between gap-2">
      <p className="text-sm font-medium text-gray-600">{label}</p>
      {href && <ArrowUpRight className="h-4 w-4 shrink-0 text-gray-400 group-hover:text-primary" aria-hidden="true" />}
    </div>
    <p className="mt-2 font-heading text-2xl font-bold tracking-tight tabular-nums text-dark sm:text-[28px]">{value}</p>
    {hint && <p className="mt-1 text-xs leading-relaxed text-gray-500">{hint}</p>}
  </>;
  const className = "group block min-w-0 border-b border-gray-200 py-4 transition-colors duration-200 hover:border-primary";
  return href ? <Link href={href} className={className}>{content}</Link> : <div className={className}>{content}</div>;
}
