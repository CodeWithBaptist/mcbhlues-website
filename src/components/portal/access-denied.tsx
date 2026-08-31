import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export function AccessDenied({ required }: { required: string[] }) {
  return (
    <div className="mx-auto max-w-xl rounded-xl border border-red-100 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
        <ShieldAlert className="h-6 w-6 text-red-500" />
      </div>
      <h1 className="font-heading text-xl font-bold text-dark">Access denied</h1>
      <p className="mt-2 text-sm text-gray-600">
        Your account does not hold the permission required to view this page. If you believe this is
        an error, contact your system administrator.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {required.map((key) => (
          <code key={key} className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700">
            {key}
          </code>
        ))}
      </div>
      <Link
        href="/portal"
        className="mt-6 inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
