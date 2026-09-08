import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";

export function AccessDenied({ required }: { required: string[] }) {
  return (
    <div className="mx-auto max-w-xl rounded-lg border border-gray-200 bg-white p-8 text-center">
      <ShieldAlert className="mx-auto h-6 w-6 text-gray-500" aria-hidden="true" />
      <h1 className="mt-4 font-heading text-xl font-bold text-dark">Access denied</h1>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">
        Your account does not hold the permission required to view this page. If you believe this is
        an error, contact your system administrator.
      </p>
      {required.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-500">Required permission</p>
          <div className="mt-1.5 flex flex-wrap justify-center gap-2">
            {required.map((key) => (
              <code key={key} className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
                {key}
              </code>
            ))}
          </div>
        </div>
      )}
      <Link href="/portal" className={buttonClasses({ size: "sm", className: "mt-6" })}>
        Back to dashboard
      </Link>
    </div>
  );
}
