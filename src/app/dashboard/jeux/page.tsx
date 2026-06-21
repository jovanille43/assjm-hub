import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Brain, ChevronRight, Gift, Swords, Target } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/dashboard/page-header";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Jeux" };

export default async function JeuxPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  const me = session.user.id;

  const [pendingDuels, openMatches] = await Promise.all([
    db.duel.count({ where: { opponentId: me, status: "PENDING" } }),
    db.match.count({ where: { status: "SCHEDULED", date: { gt: new Date() } } }),
  ]);

  const games = [
    {
      href: "/dashboard/quiz",
      emoji: "🧠",
      icon: Brain,
      title: "Quiz ASSJM",
      desc: "10 questions sur le foot et l'histoire du club. Jusqu'à 50 pts par jour.",
      tag: "Nouveau",
      tagClass: "bg-club text-white",
    },
    {
      href: "/dashboard/duels",
      emoji: "🥅",
      icon: Swords,
      title: "Duel de pénaltys",
      desc: "Défie un membre : 5 tirs, 5 plongeons. Tes stats de carte font la différence.",
      tag: pendingDuels > 0 ? `${pendingDuels} défi${pendingDuels > 1 ? "s" : ""}` : null,
      tagClass: "bg-amber-500 text-white",
    },
    {
      href: "/dashboard/pronos",
      emoji: "🎯",
      icon: Target,
      title: "Pronostics",
      desc: "Devine le score des matchs du club et empoche des points.",
      tag: openMatches > 0 ? `${openMatches} match${openMatches > 1 ? "s" : ""}` : null,
      tagClass: "bg-navy text-white",
    },
    {
      href: "/dashboard/packs",
      emoji: "🎁",
      icon: Gift,
      title: "Packs & récompenses",
      desc: "Ouvre des packs : points et boosts Prono à gagner chaque semaine.",
      tag: null,
      tagClass: "bg-navy text-white",
    },
  ];

  return (
    <div className="container max-w-2xl pb-8 pt-8 md:pb-16">
      <PageHeader
        eyebrow="Espace jeux"
        icon={Swords}
        title="Jeux du club"
        subtitle="Joue, défie tes coéquipiers et gagne des points pour faire évoluer ta carte FUT."
      />

      <div className="space-y-3">
        {games.map((g) => (
          <Link key={g.href} href={g.href}>
            <Card className="flex items-center gap-4 p-4 transition-colors hover:border-club/50">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-secondary/60 text-3xl">
                {g.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-lg font-bold">{g.title}</h2>
                  {g.tag && (
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${g.tagClass}`}>
                      {g.tag}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{g.desc}</p>
              </div>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
