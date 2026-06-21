import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const STAFF = ["ADMIN", "DIRIGEANT", "COACH"];

function csvEscape(v: string | number | null): string {
  const s = String(v ?? "");
  return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const session = await auth();
  if (!session?.user || !STAFF.includes(session.user.role ?? "")) {
    return new NextResponse("Non autorisé", { status: 401 });
  }

  const stats = await db.matchStat.findMany({
    include: {
      player: { select: { firstName: true, lastName: true, number: true, team: { select: { name: true } } } },
      match: { select: { opponent: true, date: true, scoreFor: true, scoreAgainst: true, status: true } },
    },
    where: { match: { status: "FINISHED" } },
    orderBy: { match: { date: "desc" } },
  });

  const header = ["Joueur", "N°", "Équipe", "Match", "Date", "Score", "Buts", "Passes", "Minutes", "Jaune", "Rouge", "Note", "SDM"];
  const rows = stats.map((s) => [
    csvEscape(`${s.player.firstName} ${s.player.lastName}`),
    csvEscape(s.player.number),
    csvEscape(s.player.team?.name ?? null),
    csvEscape(`vs ${s.match.opponent}`),
    csvEscape(new Date(s.match.date).toLocaleDateString("fr-FR")),
    csvEscape(`${s.match.scoreFor ?? "-"}-${s.match.scoreAgainst ?? "-"}`),
    s.goals,
    s.assists,
    s.minutes,
    s.yellow,
    s.red,
    csvEscape(s.rating),
    s.isMvp ? "Oui" : "",
  ]);

  const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="rapport-saison.csv"',
    },
  });
}
