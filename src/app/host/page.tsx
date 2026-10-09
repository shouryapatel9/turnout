"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase, EventRow, formatWhen } from "@/lib/supabase";
import { useHost } from "@/lib/useHost";
import { Shell, Card, btnCls, btnGhostCls } from "@/components/ui";

export default function HostHome() {
  const { user, ready } = useHost();
  const [events, setEvents] = useState<EventRow[] | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("events").select("*").eq("host_id", user.id).order("starts_at", { ascending: false })
      .then(({ data }) => setEvents((data as EventRow[]) ?? []));
  }, [user]);

  if (!ready) return <Shell><p className="py-12 text-stone-500">Loading…</p></Shell>;

  return (
    <Shell>
      <div className="flex items-center justify-between py-6">
        <h1 className="text-2xl font-bold">Your events</h1>
        <div className="flex gap-2">
          <button className={btnGhostCls} onClick={() => supabase.auth.signOut().then(() => location.assign("/"))}>Log out</button>
          <Link href="/host/new" className={btnCls}>+ New event</Link>
        </div>
      </div>
      {events === null ? <p className="text-stone-500">Loading…</p> :
        events.length === 0 ? <Card><p className="text-stone-600">No events yet. Create your first one.</p></Card> :
        <div className="space-y-3">
          {events.map((e) => (
            <Link key={e.id} href={`/host/e/${e.slug}`} className="block">
              <Card className="hover:border-orange-300">
                <p className="font-semibold">{e.title}</p>
                <p className="text-sm text-stone-600">{formatWhen(e.starts_at)} · {e.venue} · {e.capacity} seats</p>
              </Card>
            </Link>
          ))}
        </div>}
    </Shell>
  );
}
