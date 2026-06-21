import { db } from "@/lib/db";

export type CalItem = {
  id: string;
  kind: "MATCH" | "EVENT";
  type: string;
  title: string;
  start: string; // ISO
  location: string | null;
  teamName: string | null;
  meta: string | null;
};

export async function getCalendarItems(): Promise<CalItem[]> {
  const [matches, events] = await Promise.all([
    db.match.findMany({ include: { team: true }, orderBy: { date: "asc" } }),
    db.event.findMany({ include: { team: true }, orderBy: { start: "asc" } }),
  ]);

  const items: CalItem[] = [
    ...matches.map((m) => ({
      id: `m_${m.id}`,
      kind: "MATCH" as const,
      type: "MATCH",
      title: `ASSJM ${m.venue === "HOME" ? "vs" : "@"} ${m.opponent}`,
      start: m.date.toISOString(),
      location: m.location,
      teamName: m.team.name,
      meta:
        m.status === "FINISHED" && m.scoreFor != null
          ? `${m.scoreFor} - ${m.scoreAgainst}`
          : m.competition,
    })),
    // On exclut les events de type MATCH (déjà couverts par la table Match)
    ...events
      .filter((e) => e.type !== "MATCH")
      .map((e) => ({
        id: `e_${e.id}`,
        kind: "EVENT" as const,
        type: e.type,
        title: e.title,
        start: e.start.toISOString(),
        location: e.location,
        teamName: e.team?.name ?? null,
        meta: null,
      })),
  ];

  return items.sort((a, b) => a.start.localeCompare(b.start));
}
