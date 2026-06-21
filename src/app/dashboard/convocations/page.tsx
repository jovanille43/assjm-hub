import Link from "next/link";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarDays, ClipboardCheck, Dumbbell, MapPin, Trophy } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { RespondButtons } from "@/components/convocations/respond-buttons";
import { TrainingRespondButtons } from "@/components/convocations/training-respond-buttons";
import { ConvokeToggle } from "@/components/convocations/convoke-toggle";
import { RemindButton } from "@/components/convocations/remind-button";
import {
  getMatchConvocations,
  getPlayerConvocations,
  getUpcomingMatchesStaff,
} from "@/lib/convocations";
import { POSITIONS } from "@/lib/enums";
import { cn, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STAFF = ["COACH", "DIRIGEANT", "ADMIN"];

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  ACCEPTED: { label: "Présent", cls: "bg-emerald-500 text-white" },
  DECLINED: { label: "Absent", cls: "bg-club text-white" },
  UNCERTAIN: { label: "Incertain", cls: "bg-amber-500 text-white" },
  PENDING: { label: "En attente", cls: "bg-secondary text-muted-foreground" },
};

export default async function ConvocationsPage({
  searchParams,
}: {
  searchParams: Promise<{ match?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  const isStaff = STAFF.includes(session.user.role);

  return (
    <div className="container pb-8 pt-8 md:pb-16">
      <PageHeader
        eyebrow="Convocations"
        icon={ClipboardCheck}
        title={isStaff ? "Gérer les convocations" : "Mes convocations"}
        subtitle={
          isStaff
            ? "Présences et absences pour les matchs du club."
            : "Tes matchs, entraînements et les disponibilités de toute l'équipe."
        }
      />

      {isStaff ? (
        <CoachView searchParams={searchParams} />
      ) : (
        <PlayerView userId={session.user.id} />
      )}
    </div>
  );
}

/* ───────────────────────────── Vue Joueur ───────────────────────────── */

const STATUS_SORT: Record<string, number> = { ACCEPTED: 0, UNCERTAIN: 1, PENDING: 2, DECLINED: 3 };

// Chips couleur pour les convocations match
const ROSTER_CLS: Record<string, string> = {
  ACCEPTED:  "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  UNCERTAIN: "border-amber-500/50  bg-amber-500/10  text-amber-600  dark:text-amber-400",
  PENDING:   "border-border        bg-secondary/40  text-muted-foreground",
  DECLINED:  "border-club/40       bg-club/10       text-club",
};

// Chips couleur pour les présences entraînement
const TRAINING_CLS = {
  PRESENT: "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  ABSENT:  "border-club/40       bg-club/10       text-club",
  NONE:    "border-border        bg-secondary/40  text-muted-foreground",
};

async function PlayerView({ userId }: { userId: string }) {
  const { player, convocations, trainings } = await getPlayerConvocations(userId);

  if (!player) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        Aucun profil joueur n'est associé à ton compte. Contacte un dirigeant
        pour être rattaché à une équipe.
      </Card>
    );
  }

  if (convocations.length === 0 && trainings.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        Aucun événement à venir pour le moment. Reste prêt&nbsp;! ⚽
      </Card>
    );
  }

  // Ligne de temps unifiée, triée par date
  const timeline = [
    ...convocations.map((c) => ({ kind: "match"    as const, date: new Date(c.match.date), conv: c })),
    ...trainings.map((t)   => ({ kind: "training"  as const, date: new Date(t.start),      training: t })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime());

  return (
    <div className="space-y-4">
      {timeline.map((item) => {

        /* ════════════════ ENTRAÎNEMENT ════════════════ */
        if (item.kind === "training") {
          const t = item.training;
          const myStatus = t.attendance ?? null;
          const myBadge =
            myStatus === "PRESENT" ? { label: "Présent", cls: "bg-emerald-500 text-white" }
            : myStatus === "ABSENT"  ? { label: "Absent",  cls: "bg-club text-white" }
            : null;

          const present = t.roster.filter((r) => r.status === "PRESENT");
          const absent  = t.roster.filter((r) => r.status === "ABSENT");
          const pending = t.roster.filter((r) => r.status === null);

          return (
            <Card key={`training-${t.id}`} className="p-5">
              {/* En-tête */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary/60 text-muted-foreground">
                    <Dumbbell className="size-5" />
                  </span>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Entraînement
                    </p>
                    <p className="mt-0.5 font-display font-bold">{t.title}</p>
                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="size-4" />
                        {format(new Date(t.start), "EEEE d MMM 'à' HH'h'mm", { locale: fr })}
                      </span>
                      {t.location && (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="size-4" />
                          {t.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {myBadge && (
                  <span className={cn("rounded-full px-3 py-1 text-xs font-bold", myBadge.cls)}>
                    {myBadge.label}
                  </span>
                )}
              </div>

              {/* Ma réponse */}
              <div className="mt-4 border-t pt-4">
                <TrainingRespondButtons eventId={t.id} status={myStatus} />
              </div>

              {/* Roster complet de l'équipe */}
              {t.roster.length > 0 && (
                <div className="mt-4 border-t pt-4 space-y-3">
                  {/* Compteurs */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-emerald-500/10 py-1.5">
                      <span className="block font-display text-lg font-bold text-emerald-500">{present.length}</span>
                      <span className="text-muted-foreground">Présents</span>
                    </div>
                    <div className="rounded-lg bg-secondary/40 py-1.5">
                      <span className="block font-display text-lg font-bold">{pending.length}</span>
                      <span className="text-muted-foreground">Sans réponse</span>
                    </div>
                    <div className="rounded-lg bg-club/10 py-1.5">
                      <span className="block font-display text-lg font-bold text-club">{absent.length}</span>
                      <span className="text-muted-foreground">Absents</span>
                    </div>
                  </div>
                  {/* Chips groupés */}
                  {([
                    { label: "Présents",     players: present, cls: TRAINING_CLS.PRESENT },
                    { label: "Absents",      players: absent,  cls: TRAINING_CLS.ABSENT  },
                    { label: "Sans réponse", players: pending, cls: TRAINING_CLS.NONE    },
                  ] as const).map(
                    (group) =>
                      group.players.length > 0 && (
                        <div key={group.label}>
                          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {group.label}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {group.players.map(({ player: p }) => (
                              <span
                                key={p.id}
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
                                  group.cls,
                                )}
                              >
                                {p.number != null && <span className="opacity-50">#{p.number}</span>}
                                {p.firstName[0]}. {p.lastName}
                              </span>
                            ))}
                          </div>
                        </div>
                      ),
                  )}
                </div>
              )}
            </Card>
          );
        }

        /* ════════════════ MATCH ════════════════ */
        const c = item.conv;
        const badge = STATUS_BADGE[c.status] ?? STATUS_BADGE.PENDING;
        const sortedRoster = [...c.match.convocations].sort(
          (a, b) => (STATUS_SORT[a.status] ?? 2) - (STATUS_SORT[b.status] ?? 2),
        );

        return (
          <Card key={c.id} className="p-5">
            {/* En-tête match */}
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Match · {c.match.team.name}
                </p>
                <div className="mt-0.5 font-display text-xl font-bold">
                  ASSJM{" "}
                  <span className="text-muted-foreground">
                    {c.match.venue === "HOME" ? "vs" : "@"}
                  </span>{" "}
                  <span className="text-club">{c.match.opponent}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="size-4" />
                    {format(new Date(c.match.date), "EEEE d MMM 'à' HH'h'mm", { locale: fr })}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4" />
                    {c.match.venue === "HOME" ? "Domicile" : "Extérieur"}
                  </span>
                  {c.match.competition && (
                    <span className="inline-flex items-center gap-1.5">
                      <Trophy className="size-4" />
                      {c.match.competition}
                    </span>
                  )}
                </div>
              </div>
              <span className={cn("rounded-full px-3 py-1 text-xs font-bold", badge.cls)}>
                {badge.label}
              </span>
            </div>

            {c.status === "DECLINED" && c.reason && (
              <p className="mt-2 text-sm text-muted-foreground">Motif&nbsp;: {c.reason}</p>
            )}

            {/* Poste attribué dans la compo */}
            {(() => {
              const slot = c.match.lineup?.slots[0];
              if (!slot) return null;
              const ROLE_FR: Record<string, string> = {
                GK: "Gardien", DEF: "Défenseur", MID: "Milieu", FWD: "Attaquant",
                DM: "Milieu défensif", AM: "Milieu offensif", SUB: "Remplaçant",
              };
              return (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-club/10 px-3 py-1 text-xs font-semibold text-club">
                  ⚽ Poste : {ROLE_FR[slot.role] ?? slot.role} · {c.match.lineup?.formation}
                </div>
              );
            })()}

            {/* Ma réponse */}
            <div className="mt-4 border-t pt-4">
              <RespondButtons convocationId={c.id} status={c.status} />
            </div>

            {/* Disponibilités de l'équipe convoquée */}
            {sortedRoster.length > 0 && (
              <div className="mt-4 border-t pt-4 space-y-3">
                {/* Compteurs */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {[
                    { label: "Présents",   count: sortedRoster.filter((r) => r.status === "ACCEPTED").length,  bg: "bg-emerald-500/10", text: "text-emerald-500" },
                    { label: "Incertains", count: sortedRoster.filter((r) => r.status === "UNCERTAIN").length, bg: "bg-amber-500/10",   text: "text-amber-500"  },
                    { label: "En attente", count: sortedRoster.filter((r) => r.status === "PENDING").length,   bg: "bg-secondary/40",   text: ""               },
                    { label: "Absents",    count: sortedRoster.filter((r) => r.status === "DECLINED").length,  bg: "bg-club/10",        text: "text-club"       },
                  ].map((s) => (
                    <div key={s.label} className={cn("rounded-lg py-1.5", s.bg)}>
                      <span className={cn("block font-display text-lg font-bold", s.text)}>{s.count}</span>
                      <span className="text-muted-foreground">{s.label}</span>
                    </div>
                  ))}
                </div>
                {/* Chips par groupe */}
                {[
                  { label: "Présents",   status: "ACCEPTED",  cls: ROSTER_CLS.ACCEPTED  },
                  { label: "Incertains", status: "UNCERTAIN", cls: ROSTER_CLS.UNCERTAIN },
                  { label: "En attente", status: "PENDING",   cls: ROSTER_CLS.PENDING   },
                  { label: "Absents",    status: "DECLINED",  cls: ROSTER_CLS.DECLINED  },
                ].map((group) => {
                  const players = sortedRoster.filter((mc) => mc.status === group.status);
                  return players.length > 0 ? (
                    <div key={group.label}>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {group.label}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {players.map((mc) => (
                          <span
                            key={mc.player.id}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
                              group.cls,
                            )}
                          >
                            {mc.player.number != null && (
                              <span className="opacity-50">#{mc.player.number}</span>
                            )}
                            {mc.player.firstName[0]}. {mc.player.lastName}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

/* ───────────────────────────── Vue Coach ───────────────────────────── */

async function CoachView({
  searchParams,
}: {
  searchParams: Promise<{ match?: string }>;
}) {
  const matches = await getUpcomingMatchesStaff();
  const sp = await searchParams;
  const selectedId = sp.match ?? matches[0]?.id;
  const data = selectedId ? await getMatchConvocations(selectedId) : null;

  if (matches.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        Aucun match à venir à programmer.
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sélecteur de match */}
      <div className="flex flex-wrap gap-2">
        {matches.map((m) => (
          <Link
            key={m.id}
            href={`/dashboard/convocations?match=${m.id}`}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              m.id === selectedId
                ? "border-club bg-club text-white"
                : "bg-card hover:border-club/40",
            )}
          >
            {m.team.name} · {m.opponent}
            <span className="ml-2 opacity-70">
              {format(new Date(m.date), "d MMM", { locale: fr })}
            </span>
          </Link>
        ))}
      </div>

      {data && (
        <>
          {/* Résumé */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Présents",   value: data.accepted, cls: "text-emerald-500"      },
              { label: "Incertains", value: data.uncertain, cls: "text-amber-500"       },
              { label: "En attente", value: data.pending,   cls: "text-muted-foreground" },
              { label: "Absents",    value: data.declined,  cls: "text-club"            },
            ].map((s) => (
              <Card key={s.label} className="p-4 text-center">
                <div className={cn("font-display text-3xl font-bold", s.cls)}>
                  {s.value}
                </div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </Card>
            ))}
          </div>

          {/* Effectif */}
          <Card className="p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold">
                Effectif — {data.match.team.name}
              </h2>
              {data.pending > 0 && <RemindButton matchId={data.match.id} />}
            </div>
            <div className="space-y-2">
              {data.roster.map(({ player, convocation }) => {
                const badge = convocation
                  ? STATUS_BADGE[convocation.status] ?? STATUS_BADGE.PENDING
                  : null;
                return (
                  <div
                    key={player.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border bg-secondary/20 p-3"
                  >
                    <span className="w-6 text-center font-display font-bold text-muted-foreground">
                      {player.number ?? "—"}
                    </span>
                    <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-navy-600 to-navy-900 text-xs font-bold text-white">
                      {initials(`${player.firstName} ${player.lastName}`)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold capitalize">
                        {player.firstName} {player.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {POSITIONS[player.position as keyof typeof POSITIONS]?.label ??
                          player.position}
                        {convocation?.status === "DECLINED" && convocation.reason
                          ? ` · ${convocation.reason}`
                          : ""}
                      </p>
                    </div>
                    {badge && (
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                          badge.cls,
                        )}
                      >
                        {badge.label}
                      </span>
                    )}
                    <ConvokeToggle
                      matchId={data.match.id}
                      playerId={player.id}
                      convened={!!convocation}
                    />
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
