"use client";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Shell, Card } from "@/components/ui";

export default function CheckIn({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) { setMsg({ ok: false, text: "Only the host can check people in. Log in first." }); return; }
      const { data, error } = await supabase.rpc("check_in", { p_code: code });
      if (error) return setMsg({ ok: false, text: error.message });
      const r = data?.[0];
      if (r.already) setMsg({ ok: false, text: `${r.name} is already checked in.` });
      else if (r.status === "checked_in") setMsg({ ok: true, text: `${r.name} checked in ✓` });
      else setMsg({ ok: false, text: `${r.name} is ${r.status}, not confirmed.` });
    })();
  }, [code]);

  return (
    <Shell>
      <div className="mx-auto max-w-sm py-12">
        <Card className={msg ? (msg.ok ? "border-green-400 bg-green-50" : "border-red-300 bg-red-50") : ""}>
          <p className="text-center text-lg font-semibold">{msg?.text ?? "Checking…"}</p>
        </Card>
        {msg && !msg.ok && msg.text.includes("Log in") &&
          <p className="mt-3 text-center text-sm"><Link className="underline" href="/login">Host login</Link></p>}
      </div>
    </Shell>
  );
}
