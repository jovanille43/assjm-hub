"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Brain, CheckCircle, XCircle, Trophy, Clock, Sparkles } from "lucide-react";
import { startQuiz, submitQuiz, type QuizQuestionClient } from "@/app/dashboard/quiz/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

type Phase = "idle" | "loading" | "playing" | "answered" | "submitting" | "results";

const CATEGORY_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  RÈGLES: { bg: "bg-blue-500/15", text: "text-blue-400", label: "Règles" },
  HISTOIRE: { bg: "bg-amber-500/15", text: "text-amber-400", label: "Histoire" },
  CHAMPIONNATS: { bg: "bg-green-500/15", text: "text-green-400", label: "Championnats" },
  CLUB: { bg: "bg-club/15", text: "text-club", label: "ASSJM" },
  ANECDOTE: { bg: "bg-purple-500/15", text: "text-purple-400", label: "Anecdote" },
};

function formatCountdown(targetIso: string): string {
  const diff = new Date(targetIso).getTime() - Date.now();
  if (diff <= 0) return "maintenant";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${m} min`;
}

export function QuizGame({ canPlay, nextPlayAt }: { canPlay: boolean; nextPlayAt: string | null }) {
  const router = useRouter();
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [questions, setQuestions] = React.useState<QuizQuestionClient[]>([]);
  const [current, setCurrent] = React.useState(0);
  const [selected, setSelected] = React.useState<number | null>(null);
  const [answers, setAnswers] = React.useState<{ questionId: string; answer: number }[]>([]);
  const [result, setResult] = React.useState<{ correct: number; total: number; points: number } | null>(null);
  const [countdown, setCountdown] = React.useState("");

  React.useEffect(() => {
    if (!nextPlayAt) return;
    const tick = () => setCountdown(formatCountdown(nextPlayAt));
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [nextPlayAt]);

  async function handleStart() {
    setPhase("loading");
    const res = await startQuiz();
    if ("error" in res) {
      toast.error(res.error);
      setPhase("idle");
      return;
    }
    setQuestions(res.questions);
    setCurrent(0);
    setAnswers([]);
    setSelected(null);
    setPhase("playing");
  }

  function handleAnswer(optionIndex: number) {
    if (selected !== null || phase !== "playing") return;
    setSelected(optionIndex);
    setPhase("answered");

    const q = questions[current];
    const newAnswers = [...answers, { questionId: q.id, answer: optionIndex }];
    setAnswers(newAnswers);

    setTimeout(() => {
      if (current + 1 < questions.length) {
        setCurrent((c) => c + 1);
        setSelected(null);
        setPhase("playing");
      } else {
        handleSubmit(newAnswers);
      }
    }, 1200);
  }

  async function handleSubmit(finalAnswers: typeof answers) {
    setPhase("submitting");
    const res = await submitQuiz(finalAnswers);
    if (res.error) {
      toast.error(res.error);
      setPhase("idle");
      return;
    }
    setResult(res);
    setPhase("results");
    router.refresh();
  }

  const q = questions[current];
  const cat = q ? (CATEGORY_STYLE[q.category] ?? CATEGORY_STYLE.ANECDOTE) : null;
  const progress = questions.length > 0 ? ((current + (phase === "answered" || phase === "submitting" ? 1 : 0)) / questions.length) * 100 : 0;

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {/* ── IDLE / COOLDOWN ─────────────────────────────────────── */}
        {(phase === "idle" || phase === "loading") && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-r from-club/20 via-club/10 to-transparent p-6">
                <div className="flex items-center gap-3">
                  <span className="grid size-12 place-items-center rounded-2xl bg-club/15 text-club">
                    <Brain className="size-6" />
                  </span>
                  <div>
                    <h2 className="font-display text-xl font-bold">Quiz ASSJM</h2>
                    <p className="text-sm text-muted-foreground">10 questions · Football &amp; histoire du club</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-6">
                <div className="grid grid-cols-3 gap-3 text-center">
                  {(["RÈGLES", "CHAMPIONNATS", "CLUB"] as const).map((cat) => {
                    const s = CATEGORY_STYLE[cat];
                    return (
                      <div key={cat} className={cn("rounded-xl p-3", s.bg)}>
                        <p className={cn("text-xs font-bold", s.text)}>{s.label}</p>
                        <p className="text-[10px] text-muted-foreground">+ Histoire &amp; Anecdotes</p>
                      </div>
                    );
                  })}
                </div>

                <p className="text-sm text-muted-foreground">
                  Réponds à 10 questions pour gagner jusqu&apos;à{" "}
                  <span className="font-bold text-foreground">50 points</span>. Un quiz par jour — à toi de jouer !
                </p>

                {canPlay ? (
                  <Button onClick={handleStart} disabled={phase === "loading"} size="lg" className="w-full">
                    <Brain className="size-4" />
                    {phase === "loading" ? "Chargement…" : "Commencer le quiz"}
                  </Button>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl bg-secondary/60 px-4 py-3">
                    <Clock className="size-4 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Quiz déjà joué aujourd&apos;hui</p>
                      <p className="text-xs text-muted-foreground">
                        Prochain quiz disponible dans{" "}
                        <span className="font-bold text-foreground">{countdown || "…"}</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── PLAYING / ANSWERED ───────────────────────────────────── */}
        {(phase === "playing" || phase === "answered" || phase === "submitting") && q && (
          <motion.div
            key="playing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            {/* Progress */}
            <div className="mb-4 space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Question {current + 1} / {questions.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                <motion.div
                  className="h-full rounded-full bg-club"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>

            <Card className="p-5">
              {cat && (
                <span className={cn("mb-3 inline-block rounded-full px-3 py-1 text-[11px] font-bold", cat.bg, cat.text)}>
                  {cat.label}
                </span>
              )}
              <AnimatePresence mode="wait">
                <motion.p
                  key={q.id}
                  className="mb-5 font-display text-lg font-bold leading-snug"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {q.question}
                </motion.p>
              </AnimatePresence>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {q.options.map((opt, i) => {
                  const isSelected = selected === i;
                  const isCorrect = i === q.correctAnswer;
                  const showFeedback = phase === "answered" || phase === "submitting";

                  return (
                    <motion.button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      disabled={phase !== "playing"}
                      whileHover={phase === "playing" ? { scale: 1.02 } : {}}
                      whileTap={phase === "playing" ? { scale: 0.98 } : {}}
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                        !showFeedback && "hover:border-club/50 hover:bg-club/5",
                        showFeedback && isCorrect && "border-emerald-500 bg-emerald-500/10 text-emerald-600",
                        showFeedback && isSelected && !isCorrect && "border-red-500 bg-red-500/10 text-red-500",
                        !showFeedback && "border-border bg-card",
                        !showFeedback && isSelected && "border-club bg-club/10",
                      )}
                    >
                      <span className={cn(
                        "grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold",
                        !showFeedback && "bg-secondary text-muted-foreground",
                        showFeedback && isCorrect && "bg-emerald-500 text-white",
                        showFeedback && isSelected && !isCorrect && "bg-red-500 text-white",
                      )}>
                        {showFeedback && isCorrect ? <CheckCircle className="size-4" /> : showFeedback && isSelected && !isCorrect ? <XCircle className="size-4" /> : ["A", "B", "C", "D"][i]}
                      </span>
                      {opt}
                    </motion.button>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        )}

        {/* ── RESULTS ──────────────────────────────────────────────── */}
        {phase === "results" && result && (
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="overflow-hidden">
              <div className={cn(
                "p-6 text-center",
                result.correct >= 8 ? "bg-gradient-to-b from-amber-500/20 to-transparent" :
                result.correct >= 5 ? "bg-gradient-to-b from-club/20 to-transparent" :
                "bg-gradient-to-b from-secondary/60 to-transparent",
              )}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.2 }}
                  className="text-6xl"
                >
                  {result.correct >= 9 ? "🏆" : result.correct >= 7 ? "🎯" : result.correct >= 5 ? "👍" : "📚"}
                </motion.div>
                <h2 className="mt-3 font-display text-2xl font-extrabold">
                  {result.correct}/{result.total} bonnes réponses
                </h2>
                <p className="mt-1 text-muted-foreground">
                  {result.correct >= 9 ? "Exceptionnel ! Tu maîtrises tout." : result.correct >= 7 ? "Très bon score !" : result.correct >= 5 ? "Pas mal, tu progresses !" : "Continue à t'entraîner !"}
                </p>
              </div>

              <div className="p-6 space-y-4">
                {result.points > 0 ? (
                  <div className="flex items-center justify-center gap-2 rounded-xl bg-club/10 py-3">
                    <Sparkles className="size-4 text-club" />
                    <span className="font-display text-xl font-bold text-club">+{result.points} pts</span>
                    <span className="text-sm text-muted-foreground">remportés !</span>
                  </div>
                ) : (
                  <div className="rounded-xl bg-secondary/60 py-3 text-center text-sm text-muted-foreground">
                    Aucun point cette fois — reviens demain !
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-secondary/60 py-3">
                    <p className="font-display text-2xl font-extrabold text-emerald-500">{result.correct}</p>
                    <p className="text-[10px] text-muted-foreground">Correctes</p>
                  </div>
                  <div className="rounded-xl bg-secondary/60 py-3">
                    <p className="font-display text-2xl font-extrabold text-red-400">{result.total - result.correct}</p>
                    <p className="text-[10px] text-muted-foreground">Incorrectes</p>
                  </div>
                  <div className="rounded-xl bg-secondary/60 py-3">
                    <p className="font-display text-2xl font-extrabold">{result.points}</p>
                    <p className="text-[10px] text-muted-foreground">Points</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-secondary/60 px-4 py-3 text-sm text-muted-foreground">
                  <Clock className="size-4 shrink-0" />
                  Reviens demain pour un nouveau quiz !
                </div>

                <Button variant="outline" className="w-full" onClick={() => router.push("/dashboard")}>
                  <Trophy className="size-4" /> Retour au dashboard
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
