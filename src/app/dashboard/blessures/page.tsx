import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { HeartCrack } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatusForm, ResolveButton } from "./status-form";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Blessures & Indisponibilités" };

const STAFF = ["ADMIN", "DIRIGEANT", "COACH"];

const TYPE_LABEL: Record<string, { label: string; cls: string }> = {
  INJURY:     { label: "Blessé",          cls: "bg-red-500/15 text-red-700" },
  ILLNESS:    { label: "Malade",           cls: "bg-amber-500/15 text-amber-700" },
  SUSPENSION: { label: "Suspendu",         cls: "bg-purple-500/15 text-purple-700" },
  PERSONAL:   { label: "Indisponible",     cls: "bg-blue-500/15 text-blue-700" },
  OTHER:      { label: "Indisponible",     cls: "bg-secondary text-muted-foreground" },
};

export default async function BlessuresPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const isStaff = STAFF.includes(session.user.role ?? "");

  const player = !isStaff
    ? await db.player.findUnique({
        where: { userId: session.user.id },
        select: { id: true },
      })
    : null;

  const [active, history] = await Promise.all([
    isStaff
      ? db.playerStatus.findMany({
          where: { resolvedAt: null },
          include: { player: { select: { firstName: true, lastName: true, team: { select: { name: true } } } } },
          orderBy: { startDate: "desc" },
        })
      : player
      ? db.playerStatus.findMany({
          where: { playerId: player.id, resolvedAt: null },
          orderBy: { startDate: "desc" },
        })
      : Promise.resolve([]),
    isStaff
      ? db.playerStatus.findMany({
          where: { resolvedAt: { not: null } },
          include: { player: { select: { firstName: true, lastName: true, team: { select: { name: true } } } } },
          orderBy: { resolvedAt: "desc" },
          take: 10,
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="container max-w-2xl pb-16 pt-8">
      <PageHeader
        eyebrow="Effectif"
        icon={HeartCrack}
        title="Blessures & Indisponibilités"
        subtitle={
          isStaff
            ? "Vue temps réel des joueurs indisponibles dans tous les effectifs."
            : "Signale ton indisponibilité pour que le staff puisse gérer les convocations."
        }
      />

      {/* Formulaire joueur */}
      {!isStaff && <div className="mb-6"><StatusForm /></div>}

      {/* Indisponibles actifs */}
      {active.length > 0 && (
        <div className="mb-6 space-y-3">
          <h2 className="font-display text-base font-semibold text-muted-foreground">
            Actuellement indisponibles ({active.length})
          </h2>
          {active.map((s) => {
            const t = TYPE_LABEL[s.type] ?? TYPE_LABEL.OTHER;
            type AnyStatus = typeof s & { player: { firstName: string; lastName: string; team: { name: string } | null } };
            const sr = s as unknown as AnyStatus;
            const name = isStaff
              ? `${sr.player.firstName} ${sr.player.lastName}`
              : "Toi";
            const teamName = isStaff ? (sr.player.team?.name ?? "") : "";
            return (
              <div key={s.id} className="flex items-start justify-between gap-3 rounded-2xl border bg-card p-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", t.cls)}>
                      {t.label}
                    </span>
                    <span className="font-medium capitalize">{name}</span>
                    {teamName && <span className="text-xs text-muted-foreground">{teamName}</span>}
                  </div>
                  {s.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Depuis le {format(new Date(s.startDate), "d MMM", { locale: fr })}
                    {s.estimatedReturn
                      ? ` · Retour estimé : ${format(new Date(s.estimatedReturn), "d MMM", { locale: fr })}`
                      : ""}
                  </p>
                </div>
                <ResolveButton statusId={s.id} />
              </div>
            );
          })}
        </div>
      )}

      {/* Historique (staff seulement) */}
      {isStaff && history.length > 0 && (
        <div>
          <h2 className="mb-3 font-display text-base font-semibold text-muted-foreground">
            Historique récent
          </h2>
          <div className="space-y-2">
            {history.map((s) => {
              const t = TYPE_LABEL[s.type] ?? TYPE_LABEL.OTHER;
              const p = (s as unknown as { player: { firstName: string; lastName: string } }).player;
              return (
                <div key={s.id} className="flex items-center gap-3 rounded-xl border bg-secondary/30 px-4 py-2 text-sm opacity-70">
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", t.cls)}>
                    {t.label}
                  </span>
                  <span className="flex-1 font-medium capitalize">
                    {p.firstName} {p.lastName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    retour {format(new Date(s.resolvedAt!), "d MMM", { locale: fr })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {active.length === 0 && (
        <div className="rounded-2xl border border-dashed p-12 text-center text-sm text-muted-foreground">
          Aucune indisponibilité en cours. Tout le monde est dispo !
        </div>
      )}
    </div>
  );
}
