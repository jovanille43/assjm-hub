"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { createNews, deleteNews } from "@/app/dashboard/admin/actions";
import { Button } from "@/components/ui/button";

type News = { id: string; title: string; category: string; date: string };

export function NewsManager({ news }: { news: News[] }) {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [excerpt, setExcerpt] = React.useState("");
  const [content, setContent] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function create() {
    if (!title.trim()) return;
    startTransition(async () => {
      await createNews({ title, excerpt, content });
      setTitle("");
      setExcerpt("");
      setContent("");
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteNews(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3 rounded-xl border bg-secondary/30 p-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titre de l'actualité"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-club"
        />
        <input
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Résumé court"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-club"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Contenu..."
          rows={3}
          className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-club"
        />
        <Button size="sm" onClick={create} disabled={pending || !title.trim()}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Publier l'actualité
        </Button>
      </div>

      <ul className="divide-y rounded-xl border">
        {news.length === 0 ? (
          <li className="p-4 text-sm text-muted-foreground">Aucune actualité.</li>
        ) : (
          news.map((n) => (
            <li key={n.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{n.title}</p>
                <p className="text-xs text-muted-foreground">
                  {n.category} · {n.date}
                </p>
              </div>
              <button
                onClick={() => remove(n.id)}
                disabled={pending}
                className="grid size-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-club/10 hover:text-club disabled:opacity-50"
                aria-label="Supprimer"
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
