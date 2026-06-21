import type { ComponentType } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ArrowRight,
  Award,
  CalendarDays,
  Dumbbell,
  Goal,
  MapPin,
  PartyPopper,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { auth } from "@/auth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Crest } from "@/components/brand/crest";
import { PlayerCard } from "@/components/player/player-card";
import { UpgradePanel } from "@/components/player/upgrade-panel";
import { WelcomeModal } from "@/components/onboarding/welcome-modal";
import {
  getConvocationSummary,
  getMemberData,
  getUpcomingEvents,
} from "@/lib/dashboard";
import { getBadgeProgress } from "@/lib/badges";
import { getOpenSdmVote } from "@/lib/postmatch";
import { getLatestNews, getNextMatch } from "@/lib/data";
import { RARITY, ROLES } from "@/lib/enums";

export const dynamic = "force-dynamic";

const EVENT_ICON: Record<string, ComponentType<{ className?: string }>> = {
  TRAINING: Dumbbell,
  MATCH: Trophy,
  TOURNAMENT: Award,
  MEETING: Users,
  EVENT: PartyPopper,
};

function hoursLeft(deadline: string) {
  const h = Math.ceil((new Date(deadline).getTime() - Date.now()) / 3600_000);
  return h <= 1 ? "moins d'1h" : `${h}h`;
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const role = session.user.role ?? "SUPPORTER";
  const isStaff = ["COACH", "DIRIGEANT", "ADMIN"].includes(role);

  // Aperçu badges en lecture seule : le rendu n'attribue plus rien (aucun effet
  // de bord). L'attribution (points + notif) se fait sur action explicite.
  const badgeOverview = await getBadgeProgress(session.user.id);

  const [{ user, playerStats }, events, nextMatch, news, conv, openVote] =
    await Promise.all([
      getMemberData(session.user.id),
      getUpcomingEvents(4),
      getNextMatch(),
      getLatestNews(3),
      isStaff ? getConvocationSummary() : Promise.resolve(null),
      getOpenSdmVote(session.user.id, role),
    ]);

  const firstName =
    (user?.name ?? session.user.name ?? "").split(" ")[0] || "Champion";

  return (
    <div className="container pb-16">
      <WelcomeModal />
      {/* En-tête */}
      <header className="py-8">
        <span className="eyebrow">
          <span className="h-px w-6 bg-club" />
          Tableau de bord
        </span>
        <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">
          Salut {firstName} 👋
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Badge variant="navy">{ROLES[role as keyof typeof ROLES] ?? role}</Badge>
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
            <Zap className="size-4 text-club" />
            {user?.points ?? 0} points
          </span>
        </div>
      </header>

      {/* Appel à l'action : vote Star du match en cours */}
      {openVote && (
        <Link href={`/dashboard/apres-match/${openVote.matchId}`} className="mb-6 block">
          <Card className="border-club/40 bg-club/10 p-4 transition-colors hover:bg-club/15">
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-club text-white">
                <Star className="size-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display font-bold">Élis la Star du match ⭐</p>
                <p className="text-xs text-muted-foreground">
                  {openVote.teamName} {openVote.scoreFor}–{openVote.scoreAgainst} {openVote.opponent} · clôture dans {hoursLeft(openVote.deadline)}
                </p>
              </div>
              <ArrowRight className="size-5 shrink-0 text-club" />
            </div>
          </Card>
        </Link>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Colonne principale */}
        <div className="space-y-6 lg:col-span-2">
          {/* Carte joueur */}
          {user?.player && playerStats && (
            <Card className="p-6">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                <PlayerCard player={{ ...user.player, photo: user.player.photo ?? user.image }} />
                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="font-display text-xl font-bold">Ma carte joueur</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Ta progression de la saison à l'ASSJM.
                    </p>
                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                      {[
                        { label: "Matchs", value: playerStats.matches, icon: ShieldCheck },
                        { label: "Buts", value: playerStats.goals, icon: Goal },
                        { label: "Passes déc.", value: playerStats.assists, icon: Target },
                        { label: "MVP", value: playerStats.mvp, icon: Star },
                        { label: "Note", value: playerStats.ratingAvg ?? "–", icon: Sparkles },
                      ].map((t) => (
                        <div
                          key={t.label}
                          className="rounded-xl border bg-secondary/40 p-3 text-center"
                        >
                          <t.icon className="mx-auto size-5 text-club" />
                          <div className="mt-1 font-display text-2xl font-bold">
                            {t.value}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {t.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Panneau d'amélioration de carte */}
                  <UpgradePanel
                    upgradeLevel={user.player.upgradeLevel ?? 0}
                    userPoints={user.points ?? 0}
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Prochain match */}
          {nextMatch && (
            <Card className="relative overflow-hidden bg-navy text-white">
              <div className="absolute inset-0 bg-grid opacity-40" />
              <div className="ribbon-line absolute inset-x-0 bottom-0 h-1.5 opacity-40" />
              <div className="relative flex items-center justify-between gap-4 p-6">
                <div>
                  <span className="eyebrow text-club">
                    <span className="h-px w-6 bg-club" />
                    Prochain match
                  </span>
                  <div className="mt-2 font-display text-2xl font-bold">
                    ASSJM <span className="text-blue-100/40">vs</span>{" "}
                    <span className="text-club">{nextMatch.opponent}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-blue-100/70">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-4" />
                      {format(new Date(nextMatch.date), "EEEE d MMM 'à' HH'h'mm", {
                        locale: fr,
                      })}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-4" />
                      {nextMatch.venue === "HOME" ? "Domicile" : "Extérieur"}
                    </span>
                    <span>{nextMatch.team.name}</span>
                  </div>
                </div>
                <Crest className="hidden h-16 w-auto sm:block" />
              </div>
            </Card>
          )}

          {/* Prochains rendez-vous */}
          <Card className="p-6">
            <h2 className="mb-4 font-display text-xl font-bold">
              Prochains rendez-vous
            </h2>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun événement programmé.
              </p>
            ) : (
              <ul className="space-y-2">
                {events.map((e) => {
                  const Icon = EVENT_ICON[e.type] ?? CalendarDays;
                  return (
                    <li
                      key={e.id}
                      className="flex items-center gap-3 rounded-xl border bg-secondary/30 p-3"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-club/10 text-club">
                        <Icon className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{e.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(e.start), "EEEE d MMM · HH'h'mm", {
                            locale: fr,
                          })}
                          {e.team ? ` · ${e.team.name}` : ""}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* Convocations (staff) */}
          {isStaff && conv && (
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-xl font-bold">
                  Convocations — {conv.match.opponent}
                </h2>
                <Badge variant="muted">{conv.total} convoqués</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Présents", value: conv.accepted, cls: "text-emerald-500" },
                  { label: "Incertains", value: conv.uncertain, cls: "text-amber-500" },
                  { label: "En attente", value: conv.pending, cls: "text-muted-foreground" },
                  { label: "Absents", value: conv.declined, cls: "text-club" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl border bg-secondary/40 p-4 text-center"
                  >
                    <div className={`font-display text-3xl font-bold ${s.cls}`}>
                      {s.value}
                    </div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
              <Button asChild variant="outline" className="mt-4 w-full">
                <Link href="/dashboard/convocations">Gérer les convocations</Link>
              </Button>
            </Card>
          )}
        </div>

        {/* Colonne latérale */}
        <aside className="space-y-6">
          {/* Badges — gagnés sur le terrain et dans la vie du club */}
          <Card className="p-6">
            <h2 className="mb-1 flex items-center gap-2 font-display text-xl font-bold">
              <Award className="size-5 text-club" /> Mes badges
            </h2>
            <p className="mb-4 text-xs text-muted-foreground">
              Les badges se méritent : buts, présences, votes des coéquipiers…
            </p>

            {badgeOverview.earned.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {badgeOverview.earned.map((b) => {
                  const r = RARITY[b.rarity] ?? RARITY.COMMON;
                  return (
                    <span
                      key={b.id}
                      title={b.description}
                      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium"
                      style={{
                        borderColor: r.from,
                        background: `linear-gradient(135deg, ${r.from}22, ${r.to}11)`,
                      }}
                    >
                      <span>{b.icon}</span>
                      {b.name}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Participe aux matchs et entraînements pour débloquer tes premiers
                badges&nbsp;! 🏅
              </p>
            )}

            {/* Prochains objectifs avec progression */}
            {badgeOverview.next.length > 0 && (
              <div className="mt-5 space-y-3 border-t pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Prochains objectifs
                </p>
                {badgeOverview.next.slice(0, 3).map((b) => {
                  const r = RARITY[b.rarity] ?? RARITY.COMMON;
                  const pct = Math.round((b.current / b.target) * 100);
                  return (
                    <div key={b.id} title={b.description}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 font-medium">
                          <span className="text-base leading-none">{b.icon}</span>
                          {b.name}
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          {b.current}/{b.target}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${r.from}, ${r.to})`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Actus */}
          <Card className="p-6">
            <h2 className="mb-4 font-display text-xl font-bold">Actus du club</h2>
            <ul className="space-y-3">
              {news.map((n) => (
                <li key={n.id}>
                  <Link href="/#actualites" className="group block">
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(n.publishedAt), "d MMM", { locale: fr })}
                    </p>
                    <p className="font-medium leading-snug transition-colors group-hover:text-club">
                      {n.title}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          {/* Raccourcis */}
          <Card className="p-6">
            <h2 className="mb-4 font-display text-xl font-bold">Raccourcis</h2>
            <div className="space-y-2 text-sm">
              {[
                { label: "Communauté du club", href: "/dashboard/social" },
                { label: "Convocations", href: "/dashboard/convocations" },
                { label: "Statistiques", href: "/stats" },
                { label: "Packs & moments", href: "/dashboard/packs" },
              ].map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className="flex items-center justify-between rounded-lg border bg-secondary/30 px-3 py-2.5 transition-colors hover:border-club/40 hover:text-club"
                >
                  <span>{a.label}</span>
                  <ArrowRight className="size-4" />
                </Link>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
