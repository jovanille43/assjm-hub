"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { QUIZ_BANK } from "@/lib/quiz-questions";
import { notify } from "@/lib/notifications";
import { syncBadges } from "@/lib/badges";

const QUESTIONS_PER_GAME = 10;
const COOLDOWN_MS = 24 * 60 * 60 * 1000;
const POINTS_PER_CORRECT = 5;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export type QuizQuestionClient = {
  id: string;
  question: string;
  options: [string, string, string, string];
  category: string;
  correctAnswer: number; // visible côté client pour le feedback immédiat
};

export type QuizStatus = {
  canPlay: boolean;
  nextPlayAt: string | null; // ISO — null si canPlay
};

export async function getQuizStatus(): Promise<QuizStatus> {
  const session = await auth();
  if (!session?.user) return { canPlay: false, nextPlayAt: null };

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { lastQuizAt: true },
  });

  if (!user?.lastQuizAt) return { canPlay: true, nextPlayAt: null };

  const nextAt = new Date(user.lastQuizAt.getTime() + COOLDOWN_MS);
  if (nextAt <= new Date()) return { canPlay: true, nextPlayAt: null };

  return { canPlay: false, nextPlayAt: nextAt.toISOString() };
}

export async function startQuiz(): Promise<{ questions: QuizQuestionClient[] } | { error: string }> {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé" };

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { lastQuizAt: true },
  });

  if (user?.lastQuizAt) {
    const nextAt = new Date(user.lastQuizAt.getTime() + COOLDOWN_MS);
    if (nextAt > new Date()) return { error: "Tu as déjà joué aujourd'hui. Reviens dans quelques heures !" };
  }

  const picked = shuffle(QUIZ_BANK).slice(0, QUESTIONS_PER_GAME);
  return {
    questions: picked.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      category: q.category,
      correctAnswer: q.answer,
    })),
  };
}

export async function submitQuiz(
  answers: { questionId: string; answer: number }[],
): Promise<{ error?: string; correct: number; total: number; points: number }> {
  const session = await auth();
  if (!session?.user) return { error: "Non autorisé", correct: 0, total: 0, points: 0 };

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { lastQuizAt: true },
  });

  if (user?.lastQuizAt) {
    const nextAt = new Date(user.lastQuizAt.getTime() + COOLDOWN_MS);
    if (nextAt > new Date()) return { error: "Quiz déjà soumis.", correct: 0, total: 0, points: 0 };
  }

  // Validation server-side
  const qMap = new Map(QUIZ_BANK.map((q) => [q.id, q]));
  let correct = 0;
  for (const a of answers) {
    const q = qMap.get(a.questionId);
    if (q && q.answer === a.answer) correct++;
  }
  const total = Math.min(answers.length, QUESTIONS_PER_GAME);
  const points = correct * POINTS_PER_CORRECT;

  await db.user.update({
    where: { id: session.user.id },
    data: {
      lastQuizAt: new Date(),
      ...(points > 0 ? { points: { increment: points } } : {}),
    },
  });

  if (points > 0) {
    await Promise.all([
      notify(session.user.id, {
        type: "INFO",
        title: `Quiz ASSJM : ${correct}/${total} bonnes réponses 🧠`,
        body: `+${points} points remportés !`,
        link: "/dashboard/quiz",
      }),
      syncBadges(session.user.id).catch(() => {}),
    ]);
  }

  revalidatePath("/dashboard/quiz");
  revalidatePath("/dashboard");
  return { correct, total, points };
}
