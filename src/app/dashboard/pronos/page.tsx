import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Target, Trophy } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/dashboard/page-header";
import { PronoBoard } from "@/components/pronos/prono-board";
import { getPronoData } from "@/app/dashboard/pronos/actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pronostics" };

export default async function PronosPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const data = await getPronoData();

  return (
    <div className="container max-w-2xl pb-8 pt-8 md:pb-16">
      <Link
        href="/dashboard/jeux"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Tous les jeux
      </Link>
      <PageHeader
        eyebrow="Pronostics"
        icon={Target}
        title="Pronos du club"
        subtitle="Devine le score des matchs de l'ASSJM, gagne des points et fais évoluer ta carte FUT. Active un boost ×2 pour doubler la mise !"
      />

      <Link
        href="/dashboard/pronos/ligue"
        className="mb-5 flex items-center justify-between rounded-2xl border bg-card px-4 py-3 shadow-card transition-colors hover:border-club/50"
      >
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-club/10">
            <Trophy className="size-4 text-club" />
          </span>
          <div>
            <p className="text-sm font-bold">Ligue des pronostiqueurs</p>
            <p className="text-xs text-muted-foreground">Classement de la saison →</p>
          </div>
        </div>
      </Link>

      <PronoBoard
        myPoints={data.myPoints}
        myBoosts={data.myBoosts}
        isStaff={data.isStaff}
        upcoming={data.upcoming}
        resolved={data.resolved}
        awaiting={data.awaiting}
      />
    </div>
  );
}
