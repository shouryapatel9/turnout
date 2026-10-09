"use client";
import Link from "next/link";
import QRCode from "qrcode";
import { use, useCallback, useEffect, useState } from "react";
import { supabase, formatWhen } from "@/lib/supabase";
import { Shell, Card, StatusBadge, btnGhostCls } from "@/components/ui";

type Ticket = {
  name: string; status: string; ticket_code: string; event_slug: string; event_title: string;
  venue: string; starts_at: string; waitlist_position: number | null;
};

export default function TicketPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [t, setT] = useState<Ticket | null | undefined>(undefined);
  const [qr, setQr] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase.rpc("get_ticket", { p_code: code });
    setT((data?.[0] as Ticket) ?? null);
  }, [code]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    // The QR holds a link; when the host scans it, it opens the check-in page.
    QRCode.toDataURL(`${window.location.origin}/checkin/${code}`, { width: 260, margin: 1 }).then(setQr);
  }, [code]);

  async function cancel() {
    if (!confirm("Cancel your spot? Someone on the waitlist will get it.")) return;
    await supabase.rpc("cancel_rsvp", { p_code: code });
    load();
  }

  if (t === undefined) return <Shell><p className="py-12 text-stone-500">Loading…</p></Shell>;
  if (t === null) return <Shell><p className="py-12">Ticket not found.</p></Shell>;

  return (
    <Shell>
      <div className="mx-auto max-w-sm py-8">
        <Card className="text-center">
          <StatusBadge status={t.status} />
          <h1 className="mt-3 text-xl font-bold">{t.event_title}</h1>
          <p className="text-sm text-stone-600">{formatWhen(t.starts_at)} · {t.venue}</p>
          <p className="mt-1 text-sm">for <b>{t.name}</b></p>

          {t.status === "confirmed" && qr && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="Your check-in QR code" className="mx-auto mt-4 rounded-lg" />
              <p className="mt-2 text-xs text-stone-500">Show this at the door. Save this page&apos;s link.</p>
            </>
          )}
          {t.status === "waitlisted" && (
            <p className="mt-4 text-sm">You&apos;re <b>#{t.waitlist_position}</b> on the waitlist. If a seat opens up, you&apos;ll move up automatically. Check this page again.</p>
          )}
          {t.status === "checked_in" && <p className="mt-4 text-sm">You&apos;re checked in. Enjoy the event! 🎉</p>}
          {t.status === "cancelled" && <p className="mt-4 text-sm">This RSVP was cancelled.</p>}

          <div className="mt-5 flex justify-center gap-2">
            <Link href={`/e/${t.event_slug}`} className={btnGhostCls}>Event page</Link>
            {(t.status === "confirmed" || t.status === "waitlisted") &&
              <button onClick={cancel} className={btnGhostCls}>Can&apos;t make it</button>}
          </div>
        </Card>
      </div>
    </Shell>
  );
}
