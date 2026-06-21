"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Crown, Loader2 } from "lucide-react";
import { castVote } from "@/app/dashboard/votes/actions";
import { toast } from "@/components/ui/toast";
import type { Candidate } from "@/lib/votes";
import { cn, initials } from "@/lib/utils";

export function VotePanel({
  candidates,
  myVote,
  totalVotes,
  type,
  ctx,
  accent = "#E11D2A",
}: {
  candidates: Candidate[];
  myVote: string | null;
  totalVotes: number;
  type: "MVP" | "PLAYER_OF_MONTH";
  ctx: { matchId?: string; period?: string };
  accent?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [votingFor, setVotingFor] = React.useState<string | null>(null);
  const max = Math.max(1, ...candidates.map((c) => c.votes));

  function vote(id: string) {
    const candidate = candidates.find((c) => c.id === id);
    const alreadyMine = myVote === id;
    setVotingFor(id);
    startTransition(async () => {
      try {
        await castVote(type, id, ctx);
        router.refresh();
        if (!alreadyMine && candidate) {
          toast.success(`Vote pour ${candidate.firstName} ${candidate.lastName} enregistré`);
        }
      } catch {
        toast.error("Le vote n'a pas pu être enregistré.");
      } finally {
        setVotingFor(null);
      }
    });
  }

  return (
    <div className="space-y-2">
      {candidates.map((c, i) => {
        const isMine = myVote === c.id;
        const isLeader = i === 0 && c.votes > 0;
        return (
          <div
            key={c.id}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-2.5 transition-colors",
              isMine ? "border-club bg-club/5" : "border-border",
            )}
          >
            <span className="relative grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-navy-600 to-navy-900 text-xs font-bold text-white">
              {initials(`${c.firstName} ${c.lastName}`)}
              {isLeader && (
                <Crown className="absolute -right-1 -top-2 size-4 text-amber-400" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold">
                  {c.firstName} {c.lastName}
                </span>
                <span className="shrink-0 text-xs font-bold text-muted-foreground">
                  {c.votes} {c.votes > 1 ? "votes" : "vote"}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: accent }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(c.votes / max) * 100}%` }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
            <button
              onClick={() => vote(c.id)}
              disabled={pending}
              className={cn(
                "inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-3 text-xs font-semibold transition-colors disabled:opacity-60",
                isMine
                  ? "bg-club text-white"
                  : "border hover:border-club hover:text-club",
              )}
            >
              {votingFor === c.id && pending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : isMine ? (
                <Check className="size-3.5" />
              ) : null}
              {isMine ? "Voté" : "Voter"}
            </button>
          </div>
        );
      })}
      <p className="pt-1 text-center text-xs text-muted-foreground">
        {totalVotes} vote{totalVotes > 1 ? "s" : ""} au total
      </p>
    </div>
  );
}
