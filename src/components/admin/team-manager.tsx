"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { createTeam, deleteTeam } from "@/app/dashboard/admin/actions";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { CATEGORIES } from "@/lib/enums";
import { cn } from "@/lib/utils";

type TeamRow = {
  id: string;
  name: string;
  category: string;
  _count: { players: number; matches: number };
};

function TeamLine({ team }: { team: TeamRow }) {
  const router = useRouter();
  const [confirm, setConfirm] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function handleDelete() {
    if (!confirm) {
      setConfirm(true);
      setTimeout(() => setConfirm(false), 4000);
      return;
    }
    setBusy(true);
    const res = await deleteTeam(team.id);
    setBusy(false);
    if (res.error) { toast.error(res.error); setConfirm(false); return; }
    toast.success(`${team.name} supprimée.`);
    router.refresh();
  }

  const canDelete = team._count.players === 0 && team._count.matches === 0;

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-secondary/20 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{team.name}</p>
        <p className="text-xs text-muted-foreground">
          {CATEGORIES[team.category] ?? team.category} ·{" "}
          {team._count.players} joueur{team._count.players !== 1 ? "s" : ""} ·{" "}
          {team._count.matches} match{team._count.matches !== 1 ? "s" : ""}
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={handleDelete}
        disabled={busy || !canDelete}
        title={!canDelete ? "Retire d'abord les joueurs et matchs de cette équipe" : undefined}
        className={cn(
          "shrink-0 border-red-500/30 text-red-400 hover:bg-red-500/10",
          confirm && "bg-red-500/15 font-bold",
          !canDelete && "opacity-40",
        )}
      >
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
        {confirm ? "Confirmer ?" : ""}
      </Button>
    </div>
  );
}

export function TeamManager({ teams }: { teams: TeamRow[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("SENIOR_A");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleCreate() {
    setBusy(true);
    setError(null);
    const res = await createTeam({ name, category });
    setBusy(false);
    if (res.error) { setError(res.error); toast.error(res.error); return; }
    toast.success(`Équipe « ${name} » créée.`);
    setName("");
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {/* Liste */}
      <div className="space-y-2">
        {teams.length === 0 ? (
          <p className="py-2 text-center text-sm text-muted-foreground">Aucune équipe.</p>
        ) : (
          teams.map((t) => <TeamLine key={t.id} team={t} />)
        )}
      </div>

      {/* Formulaire d'ajout */}
      {open ? (
        <div className="space-y-2 rounded-xl border border-club/30 bg-secondary/20 p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nouvelle équipe</p>
          <input
            type="text"
            placeholder="Nom (ex : Séniors A)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-club"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-club"
          >
            {Object.entries(CATEGORIES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={busy || !name.trim()} className="flex-1">
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
              Créer
            </Button>
            <Button size="sm" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <Button size="sm" variant="outline" className="w-full" onClick={() => setOpen(true)}>
          <Plus className="size-3.5" /> Ajouter une équipe
        </Button>
      )}
    </div>
  );
}
