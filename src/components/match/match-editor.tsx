"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Check, ChevronDown, Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { recordFullMatch, deleteMatch } from "@/app/dashboard/match-center/actions";
import { cn } from "@/lib/utils";

type PlayerLite = { id: string; firstName: string; lastName: string; number: number | null };
export type MatchForEditor = {
  id: string;
  opponent: string;
  venue: string;
  date: string;
  status: string;
  scoreFor: number | null;
  scoreAgainst: number | null;
  report: string | null;
  teamName: string;
  players: PlayerLite[];
  stats: { playerId: string; goals: number; assists: number; isMvp: boolean }[];
};

function Step({ v, set, disabled }: { v: number; set: (n: number) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={() => set(Math.max(0, v - 1))} disabled={disabled || v <= 0} className="grid size-6 place-items-center rounded border disabled:opacity-40">
        <Minus className="size-3" />
      </button>
      <span className="w-5 text-center text-sm font-bold tabular-nums">{v}</span>
      <button type="button" onClick={() => set(Math.min(15, v + 1))} disabled={disabled} className="grid size-6 place-items-center rounded border disabled:opacity-40">
        <Plus className="size-3" />
      </button>
    </div>
  );
}

export function MatchEditor({ match }: { match: MatchForEditor }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [forG, setForG] = React.useState(match.scoreFor ?? 0);
  const [against, setAgainst] = React.useState(match.scoreAgainst ?? 0);
  const [report, setReport] = React.useState(match.report ?? "");
  const [rows, setRows] = React.useState<Record<string, { goals: number; assists: number }>>(() => {
    const m: Record<string, { goals: number; assists: number }> = {};
    for (const p of match.players) {
      const st = match.stats.find((s) => s.playerId === p.id);
      m[p.id] = { goals: st?.goals ?? 0, assists: st?.assists ?? 0 };
    }
    return m;
  });

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 4000);
      return;
    }
    setDeleting(true);
    const res = await deleteMatch(match.id);
    setDeleting(false);
    if (res.error) { toast.error(res.error); return; }
    toast.success("Match supprimé");
    router.refresh();
  }

  async function save() {
    setBusy(true);
    const res = await recordFullMatch({
      matchId: match.id,
      scoreFor: forG,
      scoreAgainst: against,
      report,
      mvpPlayerId: null, // l'homme du match est désormais élu par l'équipe (3ᵉ mi-temps)
      scorers: match.players.map((p) => ({ playerId: p.id, goals: rows[p.id]?.goals ?? 0, assists: rows[p.id]?.assists ?? 0 })),
    });
    setBusy(false);
    if (res.error) return toast.error(res.error);
    toast.success("Feuille de match enregistrée");
    setOpen(false);
    router.refresh();
  }

  const finished = match.status === "FINISHED";

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center">
        <button onClick={() => setOpen((o) => !o)} className="flex flex-1 items-center gap-3 p-4 text-left">
          <span className={cn("size-2 shrink-0 rounded-full", finished ? "bg-emerald-500" : "bg-amber-500")} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {match.teamName} <span className="text-muted-foreground">vs</span> {match.opponent}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(match.date), "d MMM yyyy", { locale: fr })}
              {finished ? ` · ${match.scoreFor}–${match.scoreAgainst}` : " · à saisir"}
            </p>
          </div>
          <ChevronDown className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")} />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting || busy}
          className={cn(
            "mr-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
            confirmDelete
              ? "bg-red-500/20 text-red-400"
              : "text-muted-foreground hover:bg-red-500/10 hover:text-red-400",
          )}
          title="Supprimer ce match"
        >
          {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
        </button>
      </div>

      {open && (
        <div className="space-y-4 border-t p-4">
          {/* Score */}
          <div className="flex items-center justify-center gap-4 rounded-xl bg-secondary/30 py-3">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[11px] font-semibold uppercase text-club">ASSJM</span>
              <Step v={forG} set={setForG} disabled={busy} />
            </div>
            <span className="font-display text-lg text-muted-foreground">—</span>
            <div className="flex flex-col items-center gap-1">
              <span className="max-w-[6rem] truncate text-[11px] font-semibold uppercase text-muted-foreground">{match.opponent}</span>
              <Step v={against} set={setAgainst} disabled={busy} />
            </div>
          </div>

          {/* Buteurs / passeurs / MVP */}
          {match.players.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground">Aucun joueur dans cette équipe (assigne-les dans l'effectif).</p>
          ) : (
            <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2 px-1 text-[10px] font-semibold uppercase text-muted-foreground">
                <span>Joueur</span><span>Buts</span><span>Passes</span>
              </div>
              {match.players.map((p) => (
                <div key={p.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-lg border px-2 py-1.5">
                  <span className="truncate text-sm">
                    {p.firstName} {p.lastName}
                    {p.number != null && <span className="ml-1 text-xs text-muted-foreground">#{p.number}</span>}
                  </span>
                  <Step v={rows[p.id]?.goals ?? 0} set={(n) => setRows((r) => ({ ...r, [p.id]: { ...r[p.id], goals: n } }))} disabled={busy} />
                  <Step v={rows[p.id]?.assists ?? 0} set={(n) => setRows((r) => ({ ...r, [p.id]: { ...r[p.id], assists: n } }))} disabled={busy} />
                </div>
              ))}
            </div>
          )}

          {/* Résumé */}
          <textarea
            value={report}
            onChange={(e) => setReport(e.target.value)}
            rows={2}
            placeholder="Résumé du match (optionnel)…"
            className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-club"
          />

          <Button onClick={save} disabled={busy} className="w-full">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            Enregistrer la feuille de match
          </Button>
        </div>
      )}
    </Card>
  );
}
