"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const STAFF = ["ADMIN", "DIRIGEANT", "COACH"];

async function requireStaff() {
  const session = await auth();
  if (!session?.user || !STAFF.includes(session.user.role ?? "")) return null;
  return session.user;
}

/** Recalcule le rang de toutes les lignes d'une compétition (points, puis diff, puis BP). */
async function recomputeRanks(competition: string) {
  const rows = await db.standing.findMany({ where: { competition } });
  rows.sort(
    (a, b) =>
      b.points - a.points ||
      b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst) ||
      b.goalsFor - a.goalsFor ||
      a.teamName.localeCompare(b.teamName),
  );
  await Promise.all(
    rows.map((r, i) => db.standing.update({ where: { id: r.id }, data: { rank: i + 1 } })),
  );
}

export type StandingInput = {
  id?: string;
  competition: string;
  teamName: string;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  isOurClub: boolean;
};

/** Ajoute/modifie une équipe du classement. Points & matchs joués calculés auto. */
export async function upsertStanding(input: StandingInput): Promise<{ error?: string; ok?: boolean }> {
  if (!(await requireStaff())) return { error: "Réservé au staff." };

  const competition = input.competition.trim();
  const teamName = input.teamName.trim();
  if (!competition || !teamName) return { error: "Compétition et équipe requises." };

  const n = (v: number) => Math.max(0, Math.min(999, Math.round(v || 0)));
  const won = n(input.won);
  const drawn = n(input.drawn);
  const lost = n(input.lost);
  const data = {
    competition,
    teamName,
    won,
    drawn,
    lost,
    goalsFor: n(input.goalsFor),
    goalsAgainst: n(input.goalsAgainst),
    played: won + drawn + lost,
    points: won * 3 + drawn,
    isOurClub: input.isOurClub,
  };

  if (input.id) await db.standing.update({ where: { id: input.id }, data });
  else await db.standing.create({ data: { ...data, rank: 0 } });

  await recomputeRanks(competition);
  revalidatePath("/dashboard/championnat");
  revalidatePath("/"); // la home publique affiche aussi le classement
  return { ok: true };
}

export async function deleteStanding(id: string): Promise<{ error?: string; ok?: boolean }> {
  if (!(await requireStaff())) return { error: "Réservé au staff." };
  const row = await db.standing.findUnique({ where: { id }, select: { competition: true } });
  await db.standing.delete({ where: { id } }).catch(() => {});
  if (row) await recomputeRanks(row.competition);
  revalidatePath("/dashboard/championnat");
  revalidatePath("/");
  return { ok: true };
}
