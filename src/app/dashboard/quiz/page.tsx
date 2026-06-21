import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Brain } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/dashboard/page-header";
import { QuizGame } from "@/components/quiz/quiz-game";
import { getQuizStatus } from "@/app/dashboard/quiz/actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Quiz ASSJM" };

export default async function QuizPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const status = await getQuizStatus();

  return (
    <div className="container max-w-xl pb-8 pt-8 md:pb-16">
      <Link
        href="/dashboard/jeux"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Tous les jeux
      </Link>
      <PageHeader
        eyebrow="Quiz"
        icon={Brain}
        title="Quiz ASSJM"
        subtitle="Teste tes connaissances sur le football et l'histoire de notre club. 5 pts par bonne réponse."
      />

      <QuizGame canPlay={status.canPlay} nextPlayAt={status.nextPlayAt} />
    </div>
  );
}
