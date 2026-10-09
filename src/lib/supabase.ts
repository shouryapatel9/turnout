import { createClient } from "@supabase/supabase-js";

// These two values come from Supabase → Project Settings → API.
// They are PUBLIC keys (safe in the browser); security is enforced by the database rules.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseConfigured = Boolean(url && anonKey);
export const supabase = createClient(url || "http://localhost:54321", anonKey || "missing-key");

export type EventRow = {
  id: string; slug: string; host_id: string; host_name: string; title: string;
  description: string | null; venue: string; starts_at: string; capacity: number;
};
export type RsvpRow = {
  id: string; name: string; email: string; phone: string | null;
  status: "confirmed" | "waitlisted" | "cancelled" | "checked_in";
  ticket_code: string; created_at: string; checked_in_at: string | null;
};

export function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
  });
}
