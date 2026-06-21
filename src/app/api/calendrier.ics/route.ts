import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function icsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function icsEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export async function GET() {
  const now = new Date();
  const matches = await db.match.findMany({
    where: { status: "SCHEDULED", date: { gte: now } },
    orderBy: { date: "asc" },
    include: { team: true },
  });

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ASSJM HUB//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:ASSJM — Matchs",
    "X-WR-TIMEZONE:Europe/Paris",
  ];

  for (const m of matches) {
    const start = new Date(m.date);
    const end = new Date(start.getTime() + 90 * 60 * 1000); // +90 min
    const venue = m.venue === "HOME" ? "Domicile" : "Extérieur";
    const summary = `${m.team.name} vs ${m.opponent}`;
    const description = [
      `Équipe : ${m.team.name}`,
      `Adversaire : ${m.opponent}`,
      venue,
      m.competition ? `Compétition : ${m.competition}` : "",
    ]
      .filter(Boolean)
      .join("\\n");

    lines.push(
      "BEGIN:VEVENT",
      `UID:match-${m.id}@assjm.fr`,
      `DTSTART:${icsDate(start)}`,
      `DTEND:${icsDate(end)}`,
      `SUMMARY:${icsEscape(summary)}`,
      `DESCRIPTION:${icsEscape(description)}`,
      m.location ? `LOCATION:${icsEscape(m.location)}` : "",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");

  const body = lines.filter(Boolean).join("\r\n");

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="assjm-matchs.ics"',
      "Cache-Control": "no-store",
    },
  });
}
