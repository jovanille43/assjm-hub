import { redirect } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Crown } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card } from "@/components/ui/card";
import { VotePanel } from "@/components/votes/vote-panel";
import { getPotmContext } from "@/lib/votes";

export const dynamic = "force-dynamic";

export default async function VotesPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const potm = await getPotmContext(session.user.id);

  const periodLabel = potm
    ? format(new Date(`${potm.period}-01T12:00:00`), "MMMM yyyy", { locale: fr })
    : "";

  return (
    <div className="container max-w-2xl pb-8 pt-8 md:pb-16">
      <PageHeader
        eyebrow="Vote du club"
        icon={Crown}
        title="Joueur du mois"
        subtitle="Élis le joueur du mois. (Le MVP de chaque match, lui, est désigné par le staff dans la feuille de match.)"
      />

      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-amber-500 text-white">
            <Crown className="size-5" />
          </span>
          <div>
            <h2 className="font-display text-xl font-bold">Joueur du mois</h2>
            <p className="text-xs capitalize text-muted-foreground">{periodLabel}</p>
          </div>
        </div>
        {potm && potm.candidates.length > 0 ? (
          <div className="max-h-[520px] overflow-y-auto pr-1">
            <VotePanel
              candidates={potm.candidates}
              myVote={potm.myVote}
              totalVotes={potm.totalVotes}
              type="PLAYER_OF_MONTH"
              ctx={{ period: potm.period }}
              accent="#f59e0b"
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aucun joueur à élire.</p>
        )}
      </Card>
    </div>
  );
}
