import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Award,
  BarChart3,
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Crown,
  FileText,
  HeartCrack,
  LayoutGrid,
  Medal,
  Megaphone,
  Shield,
  Star,
  Trophy,
  UserCheck,
  Users,
} from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/dashboard/page-header";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Le club" };

type Item = { href: string; icon: typeof Shield; title: string; desc: string; tag?: string | null };

export default async function ClubPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  const me = session.user.id;
  const isStaff = ["ADMIN", "DIRIGEANT", "COACH"].includes(session.user.role ?? "");

  const [pendingConvocs, nextMatch] = await Promise.all([
    db.convocation.count({ where: { status: "PENDING", player: { userId: me } } }),
    db.match.findFirst({
      where: { status: "SCHEDULED", date: { gt: new Date() } },
      orderBy: { date: "asc" },
      select: { opponent: true },
    }),
  ]);

  const sections: { title: string; items: Item[] }[] = [
    {
      title: "Vie d'équipe",
      items: [
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
        },
        {
          href: "/dashboard/annonces",
          icon: Megaphone,
          title: "Annonces",
          desc: "Les communications officielles du club.",
        },
        {
          href: "/dashboard/blessures",
          icon: HeartCrack,
          title: "Infirmerie",
          desc: "Le suivi des joueurs blessés.",
        },
      ],
    },
    {
      title: "Compétition",
      items: [
        {
          href: "/dashboard/championnat",
          icon: Trophy,
          title: "Classement championnat",
          desc: "La table du championnat de l'équipe première.",
        },
        {
          href: "/dashboard/classement",
          icon: Medal,
          title: "Classement général",
          desc: "Le classement des membres aux points et aux jeux.",
        },
        {
          href: "/stats",
          icon: BarChart3,
          title: "Statistiques",
          desc: "Buteurs, passeurs, présences et forme de l'équipe.",
        },
        {
          href: "/equipes",
          icon: Users,
          title: "Équipes",
          desc: "Les effectifs et le staff de chaque catégorie.",
        },
        {
          href: "/dashboard/club/palmares",
          icon: Award,
          title: "Palmarès",
          desc: "Meilleur buteur, passeur, joueur le mieux noté et plus assidu.",
        },
      ],
    },
    {
      title: "Après-match",
      items: [
        {
          href: "/dashboard/apres-match",
          icon: Star,
          title: "3ᵉ mi-temps",
          desc: "Star du match, notes des joueurs et titres après chaque rencontre.",
        },
        {
          href: "/dashboard/votes",
          icon: Crown,
          title: "Joueur du mois",
          desc: "Élis le joueur du mois du club.",
        },
      ],
    },
  ];

  if (isStaff) {
    sections.push({
      title: "Outils staff",
      items: [
        {
          href: "/dashboard/match-center",
          icon: ClipboardList,
          title: "Centre de match",
          desc: "Saisir résultats, buteurs, MVP et résumés.",
        },
        {
          href: "/dashboard/match-center/compo",
          icon: LayoutGrid,
          title: "Compo pré-match",
          desc: "Préparer la composition avant la rencontre.",
        },
        {
          href: "/dashboard/calendrier",
          icon: CalendarPlus,
          title: "Gérer les événements",
          desc: "Créer et modifier matchs, entraînements et événements.",
        },
        {
          href: "/dashboard/entrainements",
          icon: UserCheck,
          title: "Présences entraînement",
          desc: "Pointer les présences aux séances.",
        },
        {
          href: "/dashboard/saison",
          icon: FileText,
          title: "Rapport de saison",
          desc: "Le bilan chiffré de la saison.",
        },
      ],
    });
  }

  return (
    <div className="container max-w-3xl pb-8 pt-8 md:pb-16">
      <PageHeader
        eyebrow="Vie du club"
        icon={Shield}
        title="Le club"
        subtitle="Convocations, compétition, après-match — toute la vie sportive de l'ASSJM au même endroit."
      />

      <div className="space-y-8">
        {sections.map((section) => (
          <div key={section.title}>
            <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {section.title}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {section.items.map((it) => (
                <Link key={it.href} href={it.href}>
                  <Card className="flex h-full items-center gap-4 p-4 transition-colors hover:border-club/50">
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-secondary/60 text-club">
                      <it.icon className="size-6" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-base font-bold">{it.title}</h3>
                        {it.tag && (
                          <span className="rounded-full bg-club px-2 py-0.5 text-[10px] font-bold text-white">
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
        ))}
      </div>
    </div>
  );
}
