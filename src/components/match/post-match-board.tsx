"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Award, Bell, Crown, Loader2, Lock, Star, ThumbsUp, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import {
  voteSdm,
  ratePlayer,
  addAward,
  removeAward,
  toggleAwardVote,
  remindSdmVoters,
  setVotingMode,
} from "@/app/dashboard/apres-match/actions";
import { cn } from "@/lib/utils";

type PMPlayer = {
  id: string; name: string; number: number | null;
  votes: number; ratingAvg: number | null; ratingCount: number;
  myRating: number | null; isSelf: boolean;
};
type PMAward = {
  id: string; playerId: string; title: string; playerName: string;
  votes: number; mine: boolean; proposedByName: string | null; canRemove: boolean;
};
type PostMatch = {
  match: { id: string; opponent: string; venue: string; date: string; status: string; scoreFor: number | null; scoreAgainst: number | null; teamName: string; votingMode: string };
  isStaff: boolean; finished: boolean; canParticipate: boolean; closed: boolean; deadline: string;
  squadSize: number;
  players: PMPlayer[]; myVote: string | null; totalVotes: number;
  awards: PMAward[];
};

/** Compte à rebours live jusqu'à la clôture (48 h). */
function useCountdown(deadline: string, closed: boolean) {
  const [label, setLabel] = React.useState("");
  React.useEffect(() => {
    if (closed) return;
    const tick = () => {
      const ms = new Date(deadline).getTime() - Date.now();
      if (ms <= 0) return setLabel("");
      const h = Math.floor(ms / 3600_000);
      const m = Math.floor((ms % 3600_000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setLabel(h >= 1 ? `${h}h ${m}min` : m >= 1 ? `${m}min ${s}s` : `${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline, closed]);
  return label;
}

export function PostMatchBoard({ data }: { data: PostMatch }) {
  const router = useRouter();
  const { match, players } = data;
  const [busy, setBusy] = React.useState<string | null>(null);
  const countdown = useCountdown(data.deadline, data.closed);

  const maxVotes = Math.max(0, ...players.map((p) => p.votes));
  const pct = data.squadSize > 0 ? Math.min(100, Math.round((data.totalVotes / data.squadSize) * 100)) : 0;

  async function vote(p: PMPlayer) {
    setBusy("vote-" + p.id);
    const res = await voteSdm(match.id, p.id);
    setBusy(null);
    if (res.error) return toast.error(res.error);
    toast.success(`Vote pour ${p.name} enregistré`);
    router.refresh();
  }

  async function rate(p: PMPlayer, value: number) {
    setBusy("rate-" + p.id);
    const res = await ratePlayer(match.id, p.id, value);
    setBusy(null);
    if (res.error) return toast.error(res.error);
    router.refresh();
  }

  async function changeMode(mode: string) {
    const res = await setVotingMode(match.id, mode);
    if (res.error) return toast.error(res.error);
    toast.success("Réglage mis à jour");
    router.refresh();
  }

  async function remind() {
    setBusy("remind");
    const res = await remindSdmVoters(match.id);
    setBusy(null);
    if (res.error) return toast.error(res.error);
    toast.success(res.count === 0 ? "Tout le monde a déjà voté ! 🎉" : `${res.count} membre${res.count! > 1 ? "s" : ""} relancé${res.count! > 1 ? "s" : ""}`);
  }

  async function voteAward(id: string) {
    setBusy("award-" + id);
    const res = await toggleAwardVote(id);
    setBusy(null);
    if (res.error) return toast.error(res.error);
    router.refresh();
  }

  async function delAward(id: string) {
    const res = await removeAward(id);
    if (res.error) return toast.error(res.error);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* En-tête match */}
      <Card className="p-5 text-center">
        <p className="text-xs text-muted-foreground">{match.teamName} {match.venue === "HOME" ? "vs" : "@"} {match.opponent}</p>
        <p className="mt-1 font-display text-4xl font-extrabold tabular-nums">
          {match.scoreFor ?? "–"} <span className="text-muted-foreground">–</span> {match.scoreAgainst ?? "–"}
        </p>
        <p className="mt-1 text-xs">
          {data.closed ? (
            <span className="text-muted-foreground">Votes clôturés</span>
          ) : countdown ? (
            <span className="text-emerald-500">Clôture dans {countdown}</span>
          ) : (
            <span className="text-muted-foreground">En attente du résultat</span>
          )}
        </p>

        {/* Barre de participation */}
        {data.finished && (
          <div className="mx-auto mt-3 max-w-xs">
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-club transition-all" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {data.totalVotes}/{data.squadSize} ont voté
            </p>
          </div>
        )}
      </Card>

      {/* Contrôle staff */}
      {data.isStaff && (
        <Card className="p-4">
          <p className="mb-2 text-sm font-semibold">Réglage des votes (staff)</p>
          <div className="flex gap-2">
            {[
              { v: "ALL", label: "Tout le monde" },
              { v: "STAFF", label: "Encadrants" },
              { v: "OFF", label: "Désactivé" },
            ].map((m) => (
              <button
                key={m.v}
                onClick={() => changeMode(m.v)}
                className={cn(
                  "flex-1 rounded-lg border py-2 text-xs font-semibold transition-colors",
                  match.votingMode === m.v ? "border-club bg-club/10 text-club" : "hover:bg-secondary",
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
          {!data.closed && match.votingMode !== "OFF" && (
            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={remind} disabled={busy === "remind"}>
              {busy === "remind" ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4" />}
              Relancer les non-votants
            </Button>
          )}
        </Card>
      )}

      {/* Star du match */}
      <section>
        <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-bold">
          <Star className="size-5 text-club" /> Star du match
        </h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Vote 100% anonyme. {data.totalVotes} vote{data.totalVotes > 1 ? "s" : ""} au total.
        </p>
        <div className="space-y-2">
          {players.map((p) => {
            const isWinner = data.closed && p.votes > 0 && p.votes === maxVotes;
            return (
              <Card key={p.id} className={cn("flex items-center gap-3 p-3", isWinner && "border-amber-400 bg-amber-400/5")}>
                <span className="w-5 text-center text-xs font-bold text-muted-foreground">{p.number ?? "–"}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                  {p.name} {isWinner && <Crown className="ml-1 inline size-4 text-amber-400" />}
                </span>
                {data.closed ? (
                  <span className="text-sm font-bold tabular-nums">{p.votes}</span>
                ) : p.isSelf ? (
                  <span className="text-xs text-muted-foreground">toi</span>
                ) : data.canParticipate ? (
                  <Button
                    size="sm"
                    variant={data.myVote === p.id ? "default" : "outline"}
                    onClick={() => vote(p)}
                    disabled={busy === "vote-" + p.id}
                  >
                    {busy === "vote-" + p.id ? <Loader2 className="size-3.5 animate-spin" /> : null}
                    {data.myVote === p.id ? "Voté" : "Voter"}
                  </Button>
                ) : (
                  <Lock className="size-4 text-muted-foreground" />
                )}
              </Card>
            );
          })}
        </div>
      </section>

      {/* Notes 1-10 */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold">
          <Trophy className="size-5 text-club" /> Notes des joueurs
        </h2>
        <div className="space-y-2">
          {players.map((p) => (
            <Card key={p.id} className="flex flex-wrap items-center gap-3 p-3">
              <span className="min-w-0 flex-1 truncate text-sm font-semibold">{p.name}</span>
              {p.ratingAvg != null && (
                <span className="text-xs text-muted-foreground">
                  moy. <strong className="text-foreground">{p.ratingAvg}</strong>/10 ({p.ratingCount})
                </span>
              )}
              {p.isSelf ? (
                <span className="text-xs text-muted-foreground">—</span>
              ) : data.canParticipate ? (
                <select
                  value={p.myRating ?? ""}
                  onChange={(e) => e.target.value && rate(p, Number(e.target.value))}
                  disabled={busy === "rate-" + p.id}
                  className="rounded-lg border border-border bg-background px-2 py-1 text-sm outline-none focus:border-club"
                >
                  <option value="">Noter…</option>
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n}/10</option>
                  ))}
                </select>
              ) : (
                <Lock className="size-4 text-muted-foreground" />
              )}
            </Card>
          ))}
        </div>
      </section>

      {/* Titres / Awards — proposés par tous, plébiscités au 👍 */}
      <section>
        <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-bold">
          <Award className="size-5 text-club" /> Titres du match
        </h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Invente les distinctions de la 3ᵉ mi-temps (Plus gros raté, Plus belle chute…) et plébiscite-les au 👍.
        </p>

        {data.awards.length > 0 && (
          <div className="mb-3 space-y-2">
            {data.awards.map((a) => (
              <div key={a.id} className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm">
                <Award className="size-4 shrink-0 text-amber-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate"><strong>{a.title}</strong> — {a.playerName}</p>
                  {a.proposedByName && (
                    <p className="text-[11px] text-muted-foreground">proposé par {a.proposedByName}</p>
                  )}
                </div>
                <button
                  onClick={() => voteAward(a.id)}
                  disabled={busy === "award-" + a.id}
                  className={cn(
                    "flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
                    a.mine ? "border-club bg-club/10 text-club" : "hover:bg-secondary",
                  )}
                  aria-label="J'aime ce titre"
                >
                  <ThumbsUp className="size-3.5" /> {a.votes}
                </button>
                {a.canRemove && (
                  <button onClick={() => delAward(a.id)} className="shrink-0 text-muted-foreground hover:text-club" aria-label="Retirer">
                    <X className="size-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {data.canParticipate ? (
          <AwardForm matchId={match.id} players={players} />
        ) : data.awards.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun titre décerné pour ce match.</p>
        ) : null}
      </section>
    </div>
  );
}

function AwardForm({ matchId, players }: { matchId: string; players: PMPlayer[] }) {
  const router = useRouter();
  const [playerId, setPlayerId] = React.useState(players[0]?.id ?? "");
  const [title, setTitle] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function submit() {
    if (!title.trim()) return;
    setBusy(true);
    const res = await addAward(matchId, playerId, title);
    setBusy(false);
    if (res.error) return toast.error(res.error);
    setTitle("");
    toast.success("Titre proposé");
    router.refresh();
  }

  const input = "rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-club";
  return (
    <div className="flex flex-wrap gap-2">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre (ex : Plus gros raté)" className={cn(input, "flex-1 min-w-[10rem]")} />
      <select value={playerId} onChange={(e) => setPlayerId(e.target.value)} className={input}>
        {players.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <Button size="sm" onClick={submit} disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Award className="size-4" />}
        Proposer
      </Button>
    </div>
  );
}
