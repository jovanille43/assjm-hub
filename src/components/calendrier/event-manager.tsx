"use client";

import * as React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  BanIcon,
  CalendarPlus,
  CalendarSync,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
  Users,
  X,
  XCircle,
  MinusCircle,
  Dumbbell,
  Trophy,
  Award,
  PartyPopper,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import {
  cancelEvent,
  createEvent,
  createRecurringTraining,
  deleteEvent,
  deleteRecurringEvents,
  recordAttendance,
  updateEvent,
} from "@/app/dashboard/calendrier/actions";
import { cn } from "@/lib/utils";

type PlayerLite = { id: string; firstName: string; lastName: string; number: number | null };
type AttendanceRow = { playerId: string; status: string };

type EventItem = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  start: Date;
  end: Date | null;
  location: string | null;
  cancelled: boolean;
  recurrenceId: string | null;
  team: { id: string; name: string; players?: PlayerLite[] } | null;
  attendances: AttendanceRow[];
};

type TeamOption = { id: string; name: string };

const EVENT_TYPES = [
  { value: "TRAINING", label: "Entraînement", icon: Dumbbell },
  { value: "MATCH", label: "Match", icon: Trophy },
  { value: "TOURNAMENT", label: "Tournoi", icon: Award },
  { value: "MEETING", label: "Réunion", icon: Users },
  { value: "EVENT", label: "Événement", icon: PartyPopper },
] as const;

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  TRAINING: Dumbbell, MATCH: Trophy, TOURNAMENT: Award, MEETING: Users, EVENT: PartyPopper,
};

const inputCls = "w-full rounded-xl border border-border bg-secondary/30 px-3 py-2 text-sm outline-none focus:border-club focus:ring-1 focus:ring-club/30 transition-colors";

function fmt(d: Date) { return format(new Date(d), "yyyy-MM-dd'T'HH:mm"); }
function display(d: Date) { return format(new Date(d), "EEEE d MMM · HH'h'mm", { locale: fr }); }

function EventForm({
  teams, initial, onSubmit, onCancel,
}: {
  teams: TeamOption[];
  initial?: Partial<EventItem>;
  onSubmit: (fd: FormData) => Promise<{ error?: string }>;
  onCancel: () => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await onSubmit(fd);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    onCancel();
  }

  return (
    <form onSubmit={handle} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Type *</label>
          <select name="type" defaultValue={initial?.type ?? "TRAINING"} className={inputCls} required>
            {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Équipe</label>
          <select name="teamId" defaultValue={initial?.team?.id ?? ""} className={inputCls}>
            <option value="">— Toutes —</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Titre *</label>
        <input name="title" type="text" required defaultValue={initial?.title ?? ""} placeholder="ex : Entraînement Séniors A" className={inputCls} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Début *</label>
          <input name="start" type="datetime-local" required defaultValue={initial?.start ? fmt(initial.start) : ""} className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Fin</label>
          <input name="end" type="datetime-local" defaultValue={initial?.end ? fmt(initial.end) : ""} className={inputCls} />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Lieu</label>
        <input name="location" type="text" defaultValue={initial?.location ?? ""} placeholder="ex : Stade municipal" className={inputCls} />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Description</label>
        <textarea name="description" rows={2} defaultValue={initial?.description ?? ""} className={cn(inputCls, "resize-none")} />
      </div>
      {error && <p className="rounded-lg bg-red-500/15 px-3 py-2 text-xs text-red-400">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}><X className="size-3.5" /> Annuler</Button>
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
          Enregistrer
        </Button>
      </div>
    </form>
  );
}

function RecurringForm({ teams, onDone }: { teams: TeamOption[]; onDone: () => void }) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handle(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await createRecurringTraining(fd);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    toast.success(`${res.count} séances créées`);
    onDone();
  }

  return (
    <form onSubmit={handle} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Équipe</label>
          <select name="teamId" className={inputCls}>
            <option value="">— Toutes —</option>
            {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Nb de semaines *</label>
          <input name="weeks" type="number" min={1} max={52} defaultValue={8} required className={inputCls} />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Titre *</label>
        <input name="title" type="text" required defaultValue="Entraînement" placeholder="ex : Entraînement Séniors A" className={inputCls} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Première séance (début) *</label>
          <input name="start" type="datetime-local" required className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Heure de fin</label>
          <input name="end" type="datetime-local" className={inputCls} />
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Lieu</label>
        <input name="location" type="text" placeholder="ex : Stade municipal" className={inputCls} />
      </div>
      {error && <p className="rounded-lg bg-red-500/15 px-3 py-2 text-xs text-red-400">{error}</p>}
      <p className="text-[11px] text-muted-foreground">Génère une séance par semaine (même jour, même heure) pendant le nombre de semaines indiqué.</p>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}><X className="size-3.5" /> Annuler</Button>
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? <Loader2 className="size-3.5 animate-spin" /> : <CalendarSync className="size-3.5" />}
          Créer les séances
        </Button>
      </div>
    </form>
  );
}

function AttendancePanel({ event }: { event: EventItem }) {
  const players = event.team?.players ?? [];
  const [map, setMap] = React.useState<Record<string, string>>(() => {
    const m: Record<string, string> = {};
    for (const a of event.attendances) m[a.playerId] = a.status;
    return m;
  });
  const [loading, setLoading] = React.useState<string | null>(null);

  if (players.length === 0) {
    return <p className="text-xs text-muted-foreground">Aucun joueur dans cette équipe.</p>;
  }

  async function toggle(playerId: string, status: "PRESENT" | "ABSENT" | "EXCUSED") {
    setLoading(playerId);
    const next = map[playerId] === status ? "PRESENT" : status;
    const res = await recordAttendance(event.id, playerId, next as "PRESENT" | "ABSENT" | "EXCUSED");
    setLoading(null);
    if (res.error) { toast.error(res.error); return; }
    setMap((m) => ({ ...m, [playerId]: next }));
  }

  const stats = {
    present: Object.values(map).filter((s) => s === "PRESENT").length,
    absent: Object.values(map).filter((s) => s === "ABSENT").length,
    excused: Object.values(map).filter((s) => s === "EXCUSED").length,
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-3 text-[11px] font-semibold">
        <span className="text-emerald-400">✓ {stats.present} présent{stats.present !== 1 ? "s" : ""}</span>
        <span className="text-red-400">✗ {stats.absent} absent{stats.absent !== 1 ? "s" : ""}</span>
        {stats.excused > 0 && <span className="text-amber-400">⚬ {stats.excused} excusé{stats.excused !== 1 ? "s" : ""}</span>}
      </div>
      <div className="space-y-1">
        {players.map((p) => {
          const s = map[p.id] ?? "PRESENT";
          return (
            <div key={p.id} className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5">
              <span className="min-w-0 flex-1 truncate text-sm">
                {p.firstName} {p.lastName}
                {p.number != null && <span className="ml-1 text-xs text-muted-foreground">#{p.number}</span>}
              </span>
              <div className="flex gap-1">
                <button
                  disabled={loading === p.id}
                  onClick={() => toggle(p.id, "PRESENT")}
                  className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold transition-colors", s === "PRESENT" ? "bg-emerald-500/20 text-emerald-400" : "text-muted-foreground hover:bg-secondary")}
                >✓</button>
                <button
                  disabled={loading === p.id}
                  onClick={() => toggle(p.id, "ABSENT")}
                  className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold transition-colors", s === "ABSENT" ? "bg-red-500/20 text-red-400" : "text-muted-foreground hover:bg-secondary")}
                >✗</button>
                <button
                  disabled={loading === p.id}
                  onClick={() => toggle(p.id, "EXCUSED")}
                  className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold transition-colors", s === "EXCUSED" ? "bg-amber-500/20 text-amber-400" : "text-muted-foreground hover:bg-secondary")}
                >⚬</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EventCard({ ev, teams }: { ev: EventItem; teams: TeamOption[] }) {
  const [editId, setEditId] = React.useState(false);
  const [showAttendance, setShowAttendance] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState(false);
  const [cancelling, setCancelling] = React.useState(false);
  const [deletingRecurrence, setDeletingRecurrence] = React.useState(false);
  const Icon = TYPE_ICON[ev.type] ?? CalendarDays;
  const isTraining = ev.type === "TRAINING";

  async function handleDelete() {
    setDeletingId(true);
    const res = await deleteEvent(ev.id);
    setDeletingId(false);
    if (res?.error) toast.error(res.error);
    else toast.success("Événement supprimé");
  }

  async function handleCancel() {
    setCancelling(true);
    const res = await cancelEvent(ev.id, !ev.cancelled);
    setCancelling(false);
    if (res?.error) toast.error(res.error);
    else toast.success(ev.cancelled ? "Séance rétablie" : "Séance annulée");
  }

  async function handleDeleteRecurrence() {
    if (!ev.recurrenceId) return;
    setDeletingRecurrence(true);
    const res = await deleteRecurringEvents(ev.recurrenceId);
    setDeletingRecurrence(false);
    if (res?.error) toast.error(res.error);
    else toast.success("Toutes les séances de cette série supprimées");
  }

  if (editId) {
    return (
      <Card className="p-4">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-bold">
          <Pencil className="size-3.5 text-club" /> Modifier l'événement
        </h4>
        <EventForm
          teams={teams}
          initial={ev}
          onSubmit={async (fd) => {
            const res = await updateEvent(ev.id, fd);
            if (!res?.error) toast.success("Événement mis à jour");
            return res;
          }}
          onCancel={() => setEditId(false)}
        />
      </Card>
    );
  }

  return (
    <Card className={cn("p-4", ev.cancelled && "opacity-60")}>
      <div className="flex items-start gap-3">
        <span className={cn("mt-0.5 grid size-10 shrink-0 place-items-center rounded-xl text-club", ev.cancelled ? "bg-muted" : "bg-club/10")}>
          {ev.cancelled ? <BanIcon className="size-5 text-muted-foreground" /> : <Icon className="size-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold">{ev.title}</p>
            {ev.cancelled && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-400">ANNULÉ</span>}
            {ev.recurrenceId && !ev.cancelled && <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">Récurrent</span>}
          </div>
          <p className="text-xs text-muted-foreground">
            {display(ev.start)}{ev.team ? ` · ${ev.team.name}` : ""}
          </p>
          {ev.location && <p className="mt-0.5 text-xs text-muted-foreground">📍 {ev.location}</p>}
          {ev.description && <p className="mt-1 text-xs text-foreground/70">{ev.description}</p>}
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="size-7" onClick={() => setEditId(true)} title="Modifier">
              <Pencil className="size-3.5" />
            </Button>
            {isTraining && (
              <Button variant="ghost" size="icon" className="size-7" onClick={handleCancel} disabled={cancelling} title={ev.cancelled ? "Rétablir" : "Annuler la séance"}>
                {cancelling ? <Loader2 className="size-3.5 animate-spin" /> : ev.cancelled ? <RefreshCw className="size-3.5" /> : <BanIcon className="size-3.5" />}
              </Button>
            )}
            <Button variant="ghost" size="icon" className="size-7 text-destructive hover:text-destructive" disabled={deletingId} onClick={handleDelete} title="Supprimer">
              {deletingId ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
            </Button>
          </div>
          {ev.recurrenceId && (
            <button onClick={handleDeleteRecurrence} disabled={deletingRecurrence} className="text-[9px] text-red-400/70 hover:text-red-400 transition-colors">
              {deletingRecurrence ? "..." : "Supprimer la série"}
            </button>
          )}
        </div>
      </div>

      {/* Présences (entraînements uniquement) */}
      {isTraining && ev.team && (
        <div className="mt-3 border-t pt-3">
          <button
            onClick={() => setShowAttendance((v) => !v)}
            className="flex w-full items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ClipboardList className="size-3.5" />
            Feuille de présence
            <ChevronDown className={cn("ml-auto size-3.5 transition-transform", showAttendance && "rotate-180")} />
          </button>
          {showAttendance && (
            <div className="mt-2">
              <AttendancePanel event={ev} />
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

export function EventManager({
  events,
  teams,
}: {
  events: EventItem[];
  teams: TeamOption[];
}) {
  const [mode, setMode] = React.useState<"none" | "single" | "recurring">("none");

  async function handleCreate(fd: FormData) {
    const res = await createEvent(fd);
    if (!res?.error) toast.success("Événement créé");
    return res;
  }

  return (
    <div className="space-y-4">
      {mode === "none" && (
        <div className="flex gap-2">
          <Button onClick={() => setMode("single")} className="gap-2">
            <CalendarPlus className="size-4" /> Ajouter un événement
          </Button>
          <Button variant="outline" onClick={() => setMode("recurring")} className="gap-2">
            <CalendarSync className="size-4" /> Entraîn. récurrent
          </Button>
        </div>
      )}

      {mode === "single" && (
        <Card className="p-5">
          <h3 className="mb-4 flex items-center gap-2 font-display text-base font-bold">
            <CalendarPlus className="size-4 text-club" /> Nouvel événement
          </h3>
          <EventForm teams={teams} onSubmit={handleCreate} onCancel={() => setMode("none")} />
        </Card>
      )}

      {mode === "recurring" && (
        <Card className="p-5">
          <h3 className="mb-4 flex items-center gap-2 font-display text-base font-bold">
            <CalendarSync className="size-4 text-club" /> Entraînement récurrent (hebdomadaire)
          </h3>
          <RecurringForm teams={teams} onDone={() => setMode("none")} />
        </Card>
      )}

      {events.length === 0 && mode === "none" && (
        <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
          <CalendarDays className="mx-auto mb-2 size-8 opacity-40" />
          <p className="text-sm">Aucun événement programmé.</p>
        </div>
      )}

      <div className="space-y-3">
        {events.map((ev) => <EventCard key={ev.id} ev={ev} teams={teams} />)}
      </div>
    </div>
  );
}
