import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, LayoutGrid } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/dashboard/page-header";
import { LineupBuilder } from "./lineup-builder";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ matchId: string }>;
}): Promise<Metadata> {
  const { matchId } = await params;
  const m = await db.match.findUnique({ where: { id: matchId }, select: { opponent: true } });
  return { title: m ? `Compo vs ${m.opponent}` : "Compo" };
}

const STAFF = ["ADMIN", "DIRIGEANT", "COACH"];

export default async function LineupPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const session = await auth();
  if (!session?.user) redirect("/connexion");
  if (!STAFF.includes(session.user.role ?? "")) redirect("/dashboard");

  const match = await db.match.findUnique({
    where: { id: matchId },
    include: {
      team: {
        include: {
          players: {
            orderBy: [{ number: "asc" }, { lastName: "asc" }],
            select: { id: true, firstName: true, lastName: true, number: true },
          },
        },
      },
      convocations: {
        where: { status: { in: ["ACCEPTED", "PENDING"] } },
        select: { playerId: true, status: true },
      },
      lineup: {
        include: { slots: true },
      },
    },
  });
  if (!match) notFound();

  // Joueurs convoqués (ou tous les joueurs de l'équipe si pas de convocations)
  const convoIds = new Set(match.convocations.map((c) => c.playerId));
  const players =
    match.convocations.length > 0
      ? match.team.players.filter((p) => convoIds.has(p.id))
      : match.team.players;

  const existing = match.lineup
    ? {
        formation: match.lineup.formation,
        slots: match.lineup.slots.map((s) => ({
          role: s.role,
          slotIndex: s.slotIndex,
          playerId: s.playerId,
        })),
      }
    : null;

  return (
    <div className="container max-w-md pb-16 pt-8">
      <Link
        href="/dashboard/match-center/compo"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Tous les matchs
      </Link>
      <PageHeader
        eyebrow="Compo"
        icon={LayoutGrid}
        title={`vs ${match.opponent}`}
        subtitle={`${match.team.name} · ${format(new Date(match.date), "EEEE d MMMM, HH:mm", { locale: fr })}`}
      />

      <LineupBuilder matchId={matchId} players={players} existing={existing} />
    </div>
  );
}
