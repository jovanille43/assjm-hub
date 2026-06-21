"use client";

import * as React from "react";
import { Loader2, Megaphone, Pin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createAnnouncement, deleteAnnouncement } from "./actions";

type Team = { id: string; name: string };

export function AnnouncementForm({ teams }: { teams: Team[] }) {
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [teamId, setTeamId] = React.useState<string>("");
  const [pinned, setPinned] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState("");

  function submit() {
    if (!title.trim() || !content.trim()) {
      setError("Titre et contenu requis.");
      return;
    }
    setError("");
    startTransition(async () => {
      const res = await createAnnouncement({
        title,
        content,
        teamId: teamId || null,
        pinned,
      });
      if (res.error) {
        setError(res.error);
      } else {
        setTitle("");
        setContent("");
        setTeamId("");
        setPinned(false);
      }
    });
  }

  return (
    <div className="rounded-2xl border bg-card p-5">
      <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
        <Megaphone className="size-5 text-club" /> Nouvelle annonce
      </h2>
      <div className="space-y-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre de l'annonce"
          className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-club"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Contenu du message…"
          rows={3}
          className="w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-club"
        />
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-club"
          >
            <option value="">Tout le club</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
              className="rounded"
            />
            <Pin className="size-3.5" /> Épingler
          </label>
          <Button onClick={submit} disabled={pending} className="ml-auto">
            {pending && <Loader2 className="size-4 animate-spin" />}
            Publier
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}

export function DeleteAnnouncementButton({ id }: { id: string }) {
  const [pending, startTransition] = React.useTransition();
  return (
    <button
      onClick={() => startTransition(async () => { await deleteAnnouncement(id); })}
      disabled={pending}
      className="text-muted-foreground transition-colors hover:text-destructive"
      title="Supprimer"
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
    </button>
  );
}
