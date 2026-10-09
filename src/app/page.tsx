import Link from "next/link";
import { Shell, Card, btnCls, btnGhostCls } from "@/components/ui";

export default function Home() {
  return (
    <Shell>
      <section className="py-14">
        <p className="mb-3 text-sm font-medium text-orange-600">For tech communities in India</p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Events people actually <span className="text-orange-500">show up</span> to.
        </h1>
        <p className="mt-4 max-w-xl text-stone-600">
          Free meetups lose half their RSVPs to no-shows. Turnout handles RSVPs, automatic
          waitlists and QR check-in, so you know exactly who&apos;s coming.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/host/new" className={btnCls}>Create an event</Link>
          <Link href="/host" className={btnGhostCls}>Host dashboard</Link>
        </div>
      </section>
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Auto waitlist", "Someone cancels, the next person gets the seat. No spreadsheets."],
          ["QR check-in", "Scan tickets at the door with your phone camera."],
          ["Real show rate", "See RSVPs vs. actual turnout for every event."],
        ].map(([t, d]) => (
          <Card key={t}>
            <h3 className="font-semibold">{t}</h3>
            <p className="mt-1 text-sm text-stone-600">{d}</p>
          </Card>
        ))}
      </div>
    </Shell>
  );
}
