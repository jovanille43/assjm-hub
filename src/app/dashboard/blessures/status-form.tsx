"use client";

import * as React from "react";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reportStatus, resolveStatus } from "./actions";

const TYPES = [
  { value: "INJURY", label: "Blessure" },
  { value: "ILLNESS", label: "Maladie" },
  { value: "SUSPENSION", label: "Suspension" },
  { value: "PERSONAL", label: "Raison personnelle" },
  { value: "OTHER", label: "Autre" },
];

export function StatusForm() {
  const [type, setType] = React.useState("INJURY");
  const [description, setDescription] = React.useState("");
  const [estimatedReturn, setEstimatedReturn] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState("");

  function submit() {
    setError("");
    startTransition(async () => {
      const res = await reportStatus({ type, description, estimatedReturn });
      if (res.error) setError(res.error);
      else {
        setDescription("");
        setEstimatedReturn("");
      }
    });
  }

  return (
    <div className="rounded-2xl border bg-card p-5">
      <h2 className="mb-4 font-display text-base font-bold">Signaler une indisponibilité</h2>
      <div className="space-y-3">
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-club"
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Précision (ex: entorse cheville…)"
          className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-club"
        />
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Retour estimé :</label>
          <input
            type="date"
            value={estimatedReturn}
            onChange={(e) => setEstimatedReturn(e.target.value)}
            className="rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-club"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={submit} disabled={pending} size="sm">
          {pending && <Loader2 className="size-4 animate-spin" />}
          Signaler
        </Button>
      </div>
    </div>
  );
}

export function ResolveButton({ statusId }: { statusId: string }) {
  const [pending, startTransition] = React.useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() => startTransition(async () => { await resolveStatus(statusId); })}
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <CheckCircle className="size-3.5 text-emerald-500" />}
      De retour
    </Button>
  );
}
