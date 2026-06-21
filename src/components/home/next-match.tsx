"use client";

import * as React from "react";
import { CalendarDays, MapPin, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Crest } from "@/components/brand/crest";

type MatchInfo = {
  opponent: string;
  dateISO: string;
  venue: string;
  competition?: string | null;
  teamName: string;
};

function useCountdown(target: string) {
  // null au premier rendu : identique côté serveur et client (sinon Date.now()
  // diverge entre le HTML SSR et l'hydratation → hydration mismatch)
  const [left, setLeft] = React.useState<number | null>(null);
  React.useEffect(() => {
    const update = () =>
      setLeft(Math.max(0, new Date(target).getTime() - Date.now()));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [target]);

  const ms = left ?? 0;
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return { days, hours, mins, secs, done: left === 0, ready: left !== null };
}

function Unit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/10 font-display text-3xl font-bold tabular-nums text-white backdrop-blur sm:h-20 sm:w-20 sm:text-4xl">
        {String(value).padStart(2, "0")}
      </div>
      <span className="mt-2 text-[11px] uppercase tracking-widest text-blue-100/60">
        {label}
      </span>
    </div>
  );
}

export function NextMatch({ match }: { match: MatchInfo | null }) {
  const c = useCountdown(match?.dateISO ?? new Date().toISOString());

  return (
    <section className="section">
      <div className="relative overflow-hidden rounded-3xl bg-navy-950 p-8 text-white shadow-glow-navy md:p-12">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-club/25 blur-[100px]" />
        <div className="ribbon-line absolute inset-x-0 bottom-0 h-1.5 opacity-40 animate-ribbon-slide" />

        <div className="relative grid items-center gap-8 lg:grid-cols-2">
          <div>
            <span className="eyebrow mb-3 text-club">
              <span className="h-px w-6 bg-club" />
              Prochain match
            </span>
            {match ? (
              <>
                <h2 className="font-display text-4xl font-extrabold sm:text-5xl">
                  ASSJM <span className="text-blue-100/50">vs</span>{" "}
                  <span className="text-club">{match.opponent}</span>
                </h2>
                <div className="mt-5 flex flex-wrap gap-3 text-sm text-blue-100/80">
                  <Badge variant="navy" className="bg-white/10">
                    <CalendarDays className="size-3.5" />
                    {new Date(match.dateISO).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Badge>
                  <Badge variant="navy" className="bg-white/10">
                    <MapPin className="size-3.5" />
                    {match.venue === "HOME" ? "À domicile" : "À l'extérieur"}
                  </Badge>
                  {match.competition && (
                    <Badge variant="navy" className="bg-white/10">
                      <Trophy className="size-3.5" />
                      {match.competition}
                    </Badge>
                  )}
                </div>
                <p className="mt-3 text-sm text-blue-100/60">
                  {match.teamName}
                </p>
              </>
            ) : (
              <>
                <h2 className="font-display text-4xl font-extrabold sm:text-5xl">
                  Bientôt de retour sur les terrains
                </h2>
                <p className="mt-4 text-blue-100/70">
                  Le prochain match sera affiché ici dès sa programmation.
                </p>
              </>
            )}
          </div>

          <div className="flex flex-col items-center gap-6">
            <Crest className="h-24 w-auto" animated />
            {match && !c.done && (
              <div
                className={`flex gap-3 transition-opacity duration-500 sm:gap-4 ${
                  c.ready ? "opacity-100" : "opacity-0"
                }`}
              >
                <Unit value={c.days} label="Jours" />
                <Unit value={c.hours} label="Heures" />
                <Unit value={c.mins} label="Min" />
                <Unit value={c.secs} label="Sec" />
              </div>
            )}
            {match && c.ready && c.done && (
              <p className="font-display text-2xl font-bold text-club">
                Coup d'envoi imminent ! ⚽
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
