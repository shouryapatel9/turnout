"use client";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, EventRow, formatWhen } from "@/lib/supabase";
import { Shell, Card, inputCls, btnCls } from "@/components/ui";

export default function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [event, setEvent] = useState<EventRow | null | undefined>(undefined);
  const [left, setLeft] = useState<number | null>(null);
  const [f, setF] = useState({ name: "", email: "", phone: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    supabase.from("events").select("*").eq("slug", slug).maybeSingle().then(async ({ data }) => {
      setEvent((data as EventRow) ?? null);
      if (data) {
        const { data: taken } = await supabase.rpc("seats_taken", { p_event: data.id });
        setLeft(Math.max(0, data.capacity - (taken ?? 0)));
      }
    });
  }, [slug]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!event) return;
    setBusy(true); setErr("");
    const { data, error } = await supabase.rpc("rsvp", {
      p_event: event.id, p_name: f.name, p_email: f.email, p_phone: f.phone || null,
    });
    setBusy(false);
    if (error || !data?.[0]) setErr(error?.message ?? "Something went wrong");
    else router.push(`/t/${data[0].ticket_code}`);
  }

  if (event === undefined) return <Shell><p className="py-12 text-stone-500">Loading…</p></Shell>;
  if (event === null) return <Shell><p className="py-12">Event not found.</p></Shell>;
  const full = left === 0;

  return (
    <Shell>
      <div className="py-8">
        <p className="text-sm font-medium text-orange-600">{event.host_name}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">{event.title}</h1>
        <p className="mt-2 text-stone-600">📅 {formatWhen(event.starts_at)} &nbsp;·&nbsp; 📍 {event.venue}</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-5">
        <div className="sm:col-span-3">
          {event.description && <p className="whitespace-pre-line text-stone-700">{event.description}</p>}
        </div>
        <Card className="sm:col-span-2">
          <p className="text-sm font-semibold">
            {left === null ? "" : full ? "Event is full. Join the waitlist" : `${left} of ${event.capacity} seats left`}
          </p>
          <form onSubmit={submit} className="mt-3 space-y-3">
            <input required className={inputCls} placeholder="Full name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <input required type="email" className={inputCls} placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
            <input className={inputCls} placeholder="Phone (optional)" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
            <button className={`${btnCls} w-full`} disabled={busy}>{busy ? "Saving…" : full ? "Join waitlist" : "RSVP"}</button>
            {err && <p className="text-sm text-red-600">{err}</p>}
          </form>
        </Card>
      </div>
    </Shell>
  );
}
