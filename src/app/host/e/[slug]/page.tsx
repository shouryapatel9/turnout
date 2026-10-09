"use client";
import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { supabase, EventRow, RsvpRow, formatWhen } from "@/lib/supabase";
import { useHost } from "@/lib/useHost";
import { Shell, Card, StatusBadge, btnGhostCls } from "@/components/ui";

export default function EventDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { ready } = useHost();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [rsvps, setRsvps] = useState<RsvpRow[]>([]);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    const { data: ev } = await supabase.from("events").select("*").eq("slug", slug).single();
    if (!ev) return;
    setEvent(ev as EventRow);
    const { data } = await supabase.from("rsvps").select("*").eq("event_id", ev.id).order("created_at");
    setRsvps((data as RsvpRow[]) ?? []);
  }, [slug]);

  useEffect(() => { if (ready) load(); }, [ready, load]);

  async function checkIn(code: string) {
    await supabase.rpc("check_in", { p_code: code });
    load();
  }

  if (!ready || !event) return <Shell><p className="py-12 text-stone-500">Loading…</p></Shell>;

  const count = (s: string) => rsvps.filter((r) => r.status === s).length;
  const checkedIn = count("checked_in");
  const going = count("confirmed") + checkedIn;           // people holding a seat
  const showRate = going ? Math.round((checkedIn / going) * 100) : 0;
  const link = typeof window !== "undefined" ? `${window.location.origin}/e/${event.slug}` : "";

  return (
    <Shell>
      <div className="py-6">
        <Link href="/host" className="text-sm text-stone-500">← All events</Link>
        <h1 className="mt-2 text-2xl font-bold">{event.title}</h1>
        <p className="text-sm text-stone-600">{formatWhen(event.starts_at)} · {event.venue}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className={btnGhostCls} onClick={() => { navigator.clipboard.writeText(link); setCopied(true); }}>
            {copied ? "Link copied ✓" : "Copy RSVP link"}
          </button>
          <Link className={btnGhostCls} href={`/e/${event.slug}`}>View public page</Link>
          <button className={btnGhostCls} onClick={load}>Refresh</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Seats taken" value={`${going}/${event.capacity}`} />
        <Stat label="Waitlist" value={count("waitlisted")} />
        <Stat label="Checked in" value={checkedIn} />
        <Stat label="Show rate" value={`${showRate}%`} highlight />
      </div>

      <h2 className="mb-2 mt-8 font-semibold">Attendees ({rsvps.length})</h2>
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-stone-100 text-left text-stone-600">
            <tr><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Status</th><th className="p-3"></th></tr>
          </thead>
          <tbody>
            {rsvps.map((r) => (
              <tr key={r.id} className="border-t border-stone-100">
                <td className="p-3 font-medium">{r.name}</td>
                <td className="p-3 text-stone-600">{r.email}</td>
                <td className="p-3"><StatusBadge status={r.status} /></td>
                <td className="p-3 text-right">
                  {r.status === "confirmed" && (
                    <button className="text-sm font-medium text-orange-600" onClick={() => checkIn(r.ticket_code)}>Check in</button>
                  )}
                </td>
              </tr>
            ))}
            {rsvps.length === 0 && <tr><td className="p-3 text-stone-500" colSpan={4}>No RSVPs yet. Share your link!</td></tr>}
          </tbody>
        </table>
      </Card>
      <p className="mt-3 text-xs text-stone-500">At the door: scan attendee QR codes with your phone camera while logged in here.</p>
    </Shell>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <Card className={highlight ? "border-orange-300 bg-orange-50" : ""}>
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </Card>
  );
}
