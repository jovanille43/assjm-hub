"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Loader2, Save, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { createPlayer, deletePlayer, updatePlayerStats } from "@/app/dashboard/admin/actions";
import { POSITIONS } from "@/lib/enums";
import { overall as calcOverall } from "@/lib/utils";
import { cn } from "@/lib/utils";

type PlayerRow = {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  number: number | null;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
  upgradeLevel: number;
  team: { name: string } | null;
  teamId?: string | null;
};

type TeamRow = { id: string; name: string };

const STAT_KEYS = [
  { key: "pace", label: "RAP" },
  { key: "shooting", label: "TIR" },
  { key: "passing", label: "PAS" },
  { key: "dribbling", label: "DRI" },
  { key: "defending", label: "DEF" },
  { key: "physical", label: "PHY" },
] as const;

function StatSlider({
  statKey,
  value,
  onChange,
}: {
  statKey: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-10 text-right font-display text-sm font-bold tabular-nums">{value}</span>
      <input
        type="range"
        min={1}
        max={99}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 flex-1 cursor-pointer accent-club"
        style={{ accentColor: "#e11d2a" }}
      />
      <div
        className="w-1.5 h-5 rounded-full"
        style={{
          background: value >= 85 ? "#f59e0b" : value >= 75 ? "#22c55e" : value >= 65 ? "#3b82f6" : "#94a3b8",
        }}
      />
    </div>
  );
}

function PlayerEditor({ player, teams }: { player: PlayerRow; teams: TeamRow[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const [stats, setStats] = React.useState({
    pace: player.pace,
    shooting: player.shooting,
    passing: player.passing,
    dribbling: player.dribbling,
    defending: player.defending,
    physical: player.physical,
  });
  const [position, setPosition] = React.useState(player.position);
  const [number, setNumber] = React.useState<number | "">(player.number ?? "");
  const [teamId, setTeamId] = React.useState<string>(player.teamId ?? "");

  const ovr = calcOverall(stats);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const res = await updatePlayerStats(player.id, {
      ...stats,
      position,
      number: number === "" ? null : Number(number),
      teamId: teamId || null,
    });
    setSaving(false);
    if (res.error) { setError(res.error); toast.error(res.error); return; }
    setSaved(true);
    toast.success(`Stats de ${player.firstName} ${player.lastName} enregistrées`);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 4000);
      return;
    }
    setDeleting(true);
    setError(null);
    const res = await deletePlayer(player.id);
    if (res.error) {
      setDeleting(false);
      setError(res.error);
      toast.error(res.error);
      return;
    }
    toast.success(`${player.firstName} ${player.lastName} retiré de l'effectif`);
    router.refresh();
  }

  return (
    <div className="rounded-xl border bg-secondary/20">
      <button
        type="button"
        className="flex w-full items-center gap-3 p-3 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-navy-600 to-navy-900 text-xs font-bold text-white">
          {player.number != null ? `#${player.number}` : player.position}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {player.firstName} {player.lastName}
          </p>
          <p className="text-xs text-muted-foreground">
            {player.team?.name ?? "Sans équipe"} · OVR {ovr}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {saved && <span className="text-emerald-400">✓ Sauvegardé</span>}
          {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </div>
      </button>

      {open && (
        <div className="border-t p-4 space-y-4">
          {/* Poste, numéro & équipe */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Poste</label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
              >
                {Object.entries(POSITIONS).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">N° maillot</label>
              <input
                type="number"
                min={1}
                max={99}
                value={number}
                onChange={(e) => setNumber(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="—"
                className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Équipe</label>
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
            >
              <option value="">Sans équipe</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Stats */}
          <div className="space-y-2">
            {STAT_KEYS.map(({ key, label }) => (
              <div key={key} className="grid grid-cols-[3rem_1fr] items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground">{label}</span>
                <StatSlider
                  statKey={key}
                  value={stats[key as keyof typeof stats]}
                  onChange={(v) => setStats((s) => ({ ...s, [key]: v }))}
                />
              </div>
            ))}
          </div>

          <div className={cn(
            "rounded-lg px-3 py-1.5 text-center text-sm font-bold",
            ovr >= 85 ? "bg-amber-500/15 text-amber-400" :
            ovr >= 75 ? "bg-emerald-500/15 text-emerald-400" :
            "bg-blue-500/15 text-blue-400"
          )}>
            Overall : {ovr}
          </div>

          {error && (
            <p className="text-xs text-red-400">{error}</p>
          )}

          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving || deleting} className="flex-1">
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              Sauvegarder
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDelete}
              disabled={saving || deleting}
              className={cn(
                "border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300",
                confirmDelete && "bg-red-500/15 font-bold",
              )}
              title="Retirer ce joueur de l'effectif"
            >
              {deleting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
              {confirmDelete ? "Confirmer ?" : "Supprimer"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddPlayerForm({ teams }: { teams: TeamRow[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [position, setPosition] = React.useState("MID");
  const [number, setNumber] = React.useState<number | "">("");
  const [teamId, setTeamId] = React.useState<string>(teams[0]?.id ?? "");

  async function handleCreate() {
    setBusy(true);
    setError(null);
    const res = await createPlayer({
      firstName,
      lastName,
      position,
      number: number === "" ? null : Number(number),
      teamId: teamId || null,
    });
    setBusy(false);
    if (res.error) { setError(res.error); toast.error(res.error); return; }
    toast.success(`${firstName} ${lastName} ajouté à l'effectif`);
    setFirstName(""); setLastName(""); setNumber("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <Button size="sm" variant="outline" className="w-full" onClick={() => setOpen(true)}>
        <UserPlus className="size-3.5" />
        Ajouter un joueur
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-club/30 bg-secondary/20 p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Nouveau joueur
      </p>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          placeholder="Prénom"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
        />
        <input
          type="text"
          placeholder="Nom"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <select
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
        >
          {Object.entries(POSITIONS).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          max={99}
          placeholder="N°"
          value={number}
          onChange={(e) => setNumber(e.target.value === "" ? "" : Number(e.target.value))}
          className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
        />
        <select
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          className="rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
        >
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
          <option value="">Sans équipe</option>
        </select>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={handleCreate} disabled={busy} className="flex-1">
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <UserPlus className="size-3.5" />}
          Créer la fiche
        </Button>
        <Button size="sm" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
          Annuler
        </Button>
      </div>
      <p className="text-[10px] leading-snug text-muted-foreground">
        Stats par défaut à 70 — ajuste-les ensuite avec les curseurs.
      </p>
    </div>
  );
}

export function PlayerStatsManager({
  players,
  teams,
}: {
  players: PlayerRow[];
  teams: TeamRow[];
}) {
  const [search, setSearch] = React.useState("");

  const filtered = players.filter(
    (p) =>
      `${p.firstName} ${p.lastName} ${p.team?.name ?? ""}`.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-3">
      <AddPlayerForm teams={teams} />
      <input
        type="text"
        placeholder="Rechercher un joueur..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full rounded-xl border border-border bg-secondary/30 px-4 py-2.5 text-sm outline-none focus:border-club"
      />
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">Aucun joueur trouvé.</p>
        ) : (
          filtered.map((p) => <PlayerEditor key={p.id} player={p} teams={teams} />)
        )}
      </div>
    </div>
  );
}
