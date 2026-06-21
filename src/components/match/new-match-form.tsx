"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { createMatch } from "@/app/dashboard/match-center/actions";

type Team = { id: string; name: string };

export function NewMatchForm({ teams }: { teams: Team[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [teamId, setTeamId] = React.useState(teams[0]?.id ?? "");
  const [opponent, setOpponent] = React.useState("");
  const [date, setDate] = React.useState("");
  const [venue, setVenue] = React.useState("HOME");
  const [competition, setCompetition] = React.useState("");

  async function submit() {
    setBusy(true);
    const res = await createMatch({ teamId, opponent, date, venue, competition });
    setBusy(false);
    if (res.error) return toast.error(res.error);
    toast.success("Match créé");
    setOpponent(""); setDate(""); setCompetition("");
    setOpen(false);
    router.refresh();
  }

  const input = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-club";

  if (!open) {
    return (
      <Button variant="outline" className="w-full" onClick={() => setOpen(true)}>
        <CalendarPlus className="size-4" /> Créer un match
      </Button>
    );
  }

  return (
    <Card className="space-y-3 p-4">
      <p className="font-display font-bold">Nouveau match</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className={input}>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={venue} onChange={(e) => setVenue(e.target.value)} className={input}>
          <option value="HOME">Domicile</option>
          <option value="AWAY">Extérieur</option>
        </select>
      </div>
      <input type="text" value={opponent} onChange={(e) => setOpponent(e.target.value)} placeholder="Adversaire" className={input} />
      <div className="grid gap-2 sm:grid-cols-2">
        <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className={input} />
        <input type="text" value={competition} onChange={(e) => setCompetition(e.target.value)} placeholder="Compétition (optionnel)" className={input} />
      </div>
      <div className="flex gap-2">
        <Button onClick={submit} disabled={busy} className="flex-1">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <CalendarPlus className="size-4" />}
          Créer
        </Button>
        <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Annuler</Button>
      </div>
    </Card>
  );
}
