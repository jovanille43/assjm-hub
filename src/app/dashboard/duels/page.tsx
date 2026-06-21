import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Swords } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/dashboard/page-header";
import { DuelArena } from "@/components/duels/duel-arena";
import { getDuelData } from "@/app/dashboard/duels/actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Duels de pénaltys" };

export default async function DuelsPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const data = await getDuelData();

  return (
    <div className="container max-w-2xl pb-8 pt-8 md:pb-16">
      <Link
        href="/dashboard/jeux"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Tous les jeux
      </Link>
      <PageHeader
        eyebrow="Jeu"
        icon={Swords}
        title="Duels de pénaltys"
        subtitle="Défie un membre du club : 5 tirs, 5 plongeons. Les stats de ta carte FUT font la différence dans les face-à-face — gagne des points et fais-la évoluer."
      />

      <DuelArena
        myPoints={data.myPoints}
        opponents={data.opponents}
        incoming={data.incoming}
        outgoing={data.outgoing}
        history={data.history}
      />
    </div>
  );
}
