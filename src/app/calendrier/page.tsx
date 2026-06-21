import type { Metadata } from "next";
import Link from "next/link";
import { Calendar } from "lucide-react";
import { getCalendarItems } from "@/lib/calendar";
import { CalendarView } from "@/components/calendar/calendar-view";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Calendrier",
  description: "Matchs, entraînements et événements de l'AS Saint-Just-Malmont.",
};

export default async function CalendrierPage() {
  const items = await getCalendarItems();

  return (
    <>
      <section className="relative overflow-hidden bg-navy-950 pb-14 pt-28 text-white md:pt-32">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900 to-navy-950" />
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="pointer-events-none absolute -left-20 top-0 size-80 rounded-full bg-blue-500/20 blur-[110px]" />
        <div className="container relative">
          <span className="eyebrow text-club">
            <span className="h-px w-6 bg-club" />
            Agenda du club
          </span>
          <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">
            Le <span className="text-club">calendrier</span>
          </h1>
          <p className="mt-3 max-w-xl text-blue-100/70">
            Tous les matchs, entraînements et rendez-vous de l'ASSJM, au même
            endroit.
          </p>
          <Link
            href="/api/calendrier.ics"
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-white/20"
          >
            <Calendar className="size-4" /> Abonnement iCal (Google Calendar / iPhone)
          </Link>
        </div>
      </section>

      <section className="container py-10">
        <CalendarView items={items} />
      </section>
    </>
  );
}
