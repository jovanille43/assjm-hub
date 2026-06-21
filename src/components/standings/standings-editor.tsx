"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { upsertStanding, deleteStanding } from "@/app/dashboard/championnat/actions";
import { cn } from "@/lib/utils";

export type EditableStanding = {
  id: string;
  competition: string;
  teamName: string;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  isOurClub: boolean;
};

type Draft = {
  teamName: string;
  won: number; drawn: number; lost: number;
  goalsFor: number; goalsAgainst: number;
  isOurClub: boolean;
};

const EMPTY: Draft = { teamName: "", won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, isOurClub: false };

export function StandingsEditor({
  rows,
  defaultCompetition,
}: {
  rows: EditableStanding[];
  defaultCompetition: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [competition, setCompetition] = React.useState(defaultCompetition);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<Draft>(EMPTY);

  function startEdit(r: EditableStanding) {
    setEditingId(r.id);
    setCompetition(r.competition);
    setDraft({
      teamName: r.teamName, won: r.won, drawn: r.drawn, lost: r.lost,
      goalsFor: r.goalsFor, goalsAgainst: r.goalsAgainst, isOurClub: r.isOurClub,
    });
    if (typeof window !== "undefined") window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setDraft(EMPTY);
  }

  async function submit() {
    if (!competition.trim() || !draft.teamName.trim()) {
      return toast.error("Compétition et équipe requises.");
    }
    setBusy("save");
    const res = await upsertStanding({ id: editingId ?? undefined, competition, ...draft });
    setBusy(null);
    if (res.error) return toast.error(res.error);
    toast.success(editingId ? "Équipe mise à jour" : "Équipe ajoutée");
    resetForm();
    router.refresh();
  }

  async function remove(id: string) {
    setBusy("del-" + id);
    const res = await deleteStanding(id);
    setBusy(null);
    if (res.error) return toast.error(res.error);
    if (editingId === id) resetForm();
    router.refresh();
  }

  const num = (k: keyof Draft) => (
    <input
      type="number"
      min={0}
      value={draft[k] as number}
      onChange={(e) => setDraft((d) => ({ ...d, [k]: Math.max(0, Number(e.target.value) || 0) }))}
      className="w-14 rounded-lg border border-border bg-background px-2 py-1.5 text-center text-sm outline-none focus:border-club"
    />
  );

  return (
    <Card className="mt-6 p-4">
      <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-bold">
        <Pencil className="size-4 text-club" /> Éditer le classement (staff)
      </h2>
      <p className="mb-4 text-xs text-muted-foreground">
        Saisis victoires / nuls / défaites et les buts — les <strong>points</strong> et le <strong>rang</strong> se calculent tout seuls.
      </p>

      {/* Lignes existantes */}
      {rows.length > 0 && (
        <div className="mb-4 space-y-1.5">
          {rows.map((r) => (
            <div
              key={r.id}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm",
                r.isOurClub && "border-club/40 bg-club/5",
                editingId === r.id && "ring-1 ring-club",
              )}
            >
              <span className="min-w-0 flex-1 truncate font-medium">
                {r.teamName} {r.isOurClub && <span className="text-xs text-club">(nous)</span>}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {r.won}V {r.drawn}N {r.lost}D · {r.goalsFor}-{r.goalsAgainst}
              </span>
              <button onClick={() => startEdit(r)} className="shrink-0 text-muted-foreground hover:text-club" aria-label="Modifier">
                <Pencil className="size-4" />
              </button>
              <button
                onClick={() => remove(r.id)}
                disabled={busy === "del-" + r.id}
                className="shrink-0 text-muted-foreground hover:text-club"
                aria-label="Supprimer"
              >
                {busy === "del-" + r.id ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Formulaire ajout / édition */}
      <div className="space-y-3 rounded-xl border border-dashed p-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">{editingId ? "Modifier l'équipe" : "Ajouter une équipe"}</p>
          {editingId && (
            <button onClick={resetForm} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <X className="size-3.5" /> Annuler
            </button>
          )}
        </div>

        <input
          value={competition}
          onChange={(e) => setCompetition(e.target.value)}
          placeholder="Compétition (ex : D2 District — Poule B)"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-club"
        />
        <input
          value={draft.teamName}
          onChange={(e) => setDraft((d) => ({ ...d, teamName: e.target.value }))}
          placeholder="Nom de l'équipe"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-club"
        />

        <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
          <label className="flex flex-col items-center gap-1 text-[11px] font-semibold uppercase text-muted-foreground">V {num("won")}</label>
          <label className="flex flex-col items-center gap-1 text-[11px] font-semibold uppercase text-muted-foreground">N {num("drawn")}</label>
          <label className="flex flex-col items-center gap-1 text-[11px] font-semibold uppercase text-muted-foreground">D {num("lost")}</label>
          <label className="flex flex-col items-center gap-1 text-[11px] font-semibold uppercase text-muted-foreground">BP {num("goalsFor")}</label>
          <label className="flex flex-col items-center gap-1 text-[11px] font-semibold uppercase text-muted-foreground">BC {num("goalsAgainst")}</label>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.isOurClub}
            onChange={(e) => setDraft((d) => ({ ...d, isOurClub: e.target.checked }))}
            className="size-4 accent-club"
          />
          C'est notre club (ASSJM)
        </label>

        <Button onClick={submit} disabled={busy === "save"} className="w-full">
          {busy === "save" ? <Loader2 className="size-4 animate-spin" /> : editingId ? <Save className="size-4" /> : <Plus className="size-4" />}
          {editingId ? "Enregistrer" : "Ajouter l'équipe"}
        </Button>
      </div>
    </Card>
  );
}
