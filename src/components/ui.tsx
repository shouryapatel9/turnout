import Link from "next/link";
import { ReactNode } from "react";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
        <Link href="/" className="text-lg font-bold tracking-tight">
          turnout<span className="text-orange-500">.</span>
        </Link>
        <Link href="/host" className="text-sm text-stone-600 hover:text-stone-900">Host dashboard</Link>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-16">{children}</main>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-stone-200 bg-white p-5 shadow-sm ${className}`}>{children}</div>;
}

export const inputCls =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100";
export const btnCls =
  "inline-flex items-center justify-center rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50";
export const btnGhostCls =
  "inline-flex items-center justify-center rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium hover:bg-stone-100 disabled:opacity-50";

export function SetupNotice() {
  return (
    <Card className="border-amber-300 bg-amber-50 text-sm">
      Supabase isn&apos;t connected yet. Add your project URL and anon key to <code>.env.local</code>.
    </Card>
  );
}

const badge: Record<string, string> = {
  confirmed: "bg-green-100 text-green-800",
  waitlisted: "bg-amber-100 text-amber-800",
  cancelled: "bg-stone-200 text-stone-600",
  checked_in: "bg-blue-100 text-blue-800",
};
export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge[status] ?? ""}`}>
      {status.replace("_", " ")}
    </span>
  );
}
