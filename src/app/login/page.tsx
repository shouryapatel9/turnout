"use client";
import { useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { Shell, Card, inputCls, btnCls, SetupNotice } from "@/components/ui";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/host` },
    });
    setBusy(false);
    if (error) setErr(error.message); else setSent(true);
  }

  return (
    <Shell>
      <div className="mx-auto max-w-sm py-12">
        {!supabaseConfigured && <SetupNotice />}
        <Card>
          <h1 className="text-xl font-semibold">Host login</h1>
          {sent ? (
            <p className="mt-3 text-sm text-stone-600">Check <b>{email}</b> for a login link.</p>
          ) : (
            <form onSubmit={send} className="mt-4 space-y-3">
              <input className={inputCls} type="email" required placeholder="you@community.com"
                value={email} onChange={(e) => setEmail(e.target.value)} />
              <button className={`${btnCls} w-full`} disabled={busy}>{busy ? "Sending…" : "Email me a login link"}</button>
              {err && <p className="text-sm text-red-600">{err}</p>}
            </form>
          )}
        </Card>
      </div>
    </Shell>
  );
}
