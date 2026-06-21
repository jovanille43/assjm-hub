import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Award, BarChart3, CalendarDays, ChevronRight, ClipboardCheck, ClipboardList, Crown, Shield, Star, Trophy, Users } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/dashboard/page-header";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Le club" };

export default async function ClubPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  const me = session.user.id;

  const [pendingConvocs, nextMatch] = await Promise.all([
    db.convocation.count({ where: { status: "PENDING", player: { userId: me } } }),
    db.match.findFirst({
      where: { status: "SCHEDULED", date: { gt: new Date() } },
      orderBy: { date: "asc" },
      select: { opponent: true },
    }),
  ]);

  const items = [
    {
      href: "/dashboard/convocations",
      icon: ClipboardCheck,
      title: "Convocations",
      desc: "Réponds présent ou indique ton absence pour les matchs.",
      tag: pendingConvocs > 0 ? `${pendingConvocs} à répondre` : null,
    },
    {
      href: "/calendrier",
      icon: CalendarDays,
      title: "Calendrier",
      desc: nextMatch ? `Prochain : ${nextMatch.opponent}` : "Matchs, entraînements et événements.",
      tag: null,
    },
    {
      href: "/dashboard/apres-match",
      icon: Star,
      title: "3ᵉ mi-temps",
      desc: "Star du match, notes des joueurs et titres après chaque rencontre.",
      tag: null,
    },
    {
      href: "/dashboard/votes",
      icon: Crown,
      title: "Joueur du mois",
      desc: "Élis le joueur du mois du club.",
      tag: null,
    },
    {
      href: "/stats",
      icon: BarChart3,
      title: "Statistiques",
      desc: "Buteurs, passeurs, présences et forme de l'équipe.",
      tag: null,
    },
    {
      href: "/dashboard/championnat",
      icon: Trophy,
      title: "Classement championnat",
      desc: "La table du championnat de l'équipe première.",
      tag: null,
    },
    {
      href: "/equipes",
      icon: Users,
      title: "Équipes",
      desc: "Les effectifs et le staff de chaque catégorie.",
      tag: null,
    },
    {
      href: "/dashboard/club/palmares",
      icon: Award,
      title: "Palmarès",
      desc: "Meilleur buteur, passeur, joueur le mieux noté et plus assidu.",
      tag: null,
    },
  ];

  const isStaff = ["ADMIN", "DIRIGEANT", "COACH"].includes(session.user.role ?? "");
  if (isStaff) {
    items.unshift({
      href: "/dashboard/match-center",
      icon: ClipboardList,
      title: "Centre de match",
      desc: "Saisir résultats, buteurs, MVP et résumés (staff).",
      tag: "Staff",
    });
  }

  return (
    <div className="container max-w-2xl pb-8 pt-8 md:pb-16">
      <PageHeader
        eyebrow="Vie du club"
        icon={Shield}
        title="Le club"
        subtitle="Matchs, convocations, votes et statistiques — toute la vie sportive de l'ASSJM au même endroit."
      />

      <div className="space-y-3">
        {items.map((it) => (
          <Link key={it.href} href={it.href}>
            <Card className="flex items-center gap-4 p-4 transition-colors hover:border-club/50">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-secondary/60 text-club">
                <it.icon className="size-6" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-lg font-bold">{it.title}</h2>
                  {it.tag && (
                    <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                      {it.tag}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{it.desc}</p>
              </div>
              <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
