import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, ChevronRight, Star } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/dashboard/page-header";
import { db } from "@/lib/db";
import { sdmDeadline } from "@/lib/postmatch";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "3ᵉ mi-temps" };

export default async function ApresMatchPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const matches = await db.match.findMany({
    where: { status: "FINISHED" },
    orderBy: { date: "desc" },
    take: 15,
    include: { team: { select: { name: true } } },
  });

  return (
    <div className="container max-w-2xl pb-8 pt-8 md:pb-16">
      <Link href="/dashboard/club" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Le club
      </Link>
      <PageHeader
        eyebrow="Convivialité"
        icon={Star}
        title="3ᵉ mi-temps"
        subtitle="Élis la Star du match, note tes coéquipiers et décerne les titres — on refait le match !"
      />

      {matches.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Aucun match terminé pour l'instant.
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((m) => {
            const open = new Date() <= sdmDeadline(m.date);
            return (
              <Link key={m.id} href={`/dashboard/apres-match/${m.id}`}>
                <Card className="flex items-center gap-4 p-4 transition-colors hover:border-club/50">
                  <span className="font-display text-xl font-extrabold tabular-nums">
                    {m.scoreFor ?? "–"}<span className="text-muted-foreground">-</span>{m.scoreAgainst ?? "–"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{m.team.name} {m.venue === "HOME" ? "vs" : "@"} {m.opponent}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(m.date), "d MMM yyyy", { locale: fr })}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${open ? "bg-emerald-500 text-white" : "bg-secondary text-muted-foreground"}`}>
                    {open ? "Votes ouverts" : "Clôturé"}
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
