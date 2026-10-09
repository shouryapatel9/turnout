"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useHost } from "@/lib/useHost";
import { Shell, Card, inputCls, btnCls } from "@/components/ui";

function makeSlug(title: string) {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);
  return `${base || "event"}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function NewEvent() {
  const { user, ready } = useHost();
  const router = useRouter();
  const [f, setF] = useState({ title: "", host_name: "", description: "", venue: "", starts_at: "", capacity: "50" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setBusy(true); setErr("");
    const slug = makeSlug(f.title);
    const { error } = await supabase.from("events").insert({
      slug, host_id: user.id, host_name: f.host_name, title: f.title, description: f.description || null,
      venue: f.venue, starts_at: new Date(f.starts_at).toISOString(), capacity: Number(f.capacity),
    });
    setBusy(false);
    if (error) setErr(error.message); else router.push(`/host/e/${slug}`);
  }

  if (!ready) return <Shell><p className="py-12 text-stone-500">Loading…</p></Shell>;
  return (
    <Shell>
      <h1 className="py-6 text-2xl font-bold">Create an event</h1>
      <Card>
        <form onSubmit={create} className="space-y-4">
          <Field label="Event name"><input required className={inputCls} value={f.title} onChange={set("title")} placeholder="Bengaluru AI Builders Meetup #4" /></Field>
          <Field label="Hosted by (community name)"><input required className={inputCls} value={f.host_name} onChange={set("host_name")} placeholder="AI Builders BLR" /></Field>
          <Field label="Description"><textarea rows={4} className={inputCls} value={f.description} onChange={set("description")} placeholder="What's happening, who should come, agenda…" /></Field>
          <Field label="Venue"><input required className={inputCls} value={f.venue} onChange={set("venue")} placeholder="91springboard, HSR Layout" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date & time"><input required type="datetime-local" className={inputCls} value={f.starts_at} onChange={set("starts_at")} /></Field>
            <Field label="Capacity (seats)"><input required type="number" min={1} className={inputCls} value={f.capacity} onChange={set("capacity")} /></Field>
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button className={btnCls} disabled={busy}>{busy ? "Creating…" : "Create event"}</button>
        </form>
      </Card>
    </Shell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block space-y-1"><span className="text-sm font-medium">{label}</span>{children}</label>;
}
