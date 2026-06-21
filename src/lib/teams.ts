import { db } from "@/lib/db";

const ORDER = [
  "SENIOR_A",
  "SENIOR_B",
  "VETERAN",
  "FEMININE",
  "U18",
  "U15",
  "U13",
  "U11",
  "U9",
  "U7",
];

export async function getTeams() {
  const teams = await db.team.findMany({
    include: { _count: { select: { players: true } } },
  });
  return teams.sort(
    (a, b) => ORDER.indexOf(a.category) - ORDER.indexOf(b.category),
  );
}

export function getTeamBySlug(slug: string) {
  return db.team.findUnique({
    where: { slug },
    include: {
      players: { orderBy: [{ number: "asc" }] },
      staff: true,
    },
  });
}
