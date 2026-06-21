"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { useSession } from "next-auth/react";
import { createPost } from "@/app/dashboard/social/actions";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { toast } from "@/components/ui/toast";

const CATS: [string, string][] = [
  ["GENERAL", "Général"],
  ["RESULTAT", "Résultat"],
  ["MOMENT", "Moment fort"],
  ["ANNONCE", "Annonce"],
];

export function PostComposer({ authorName }: { authorName: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [content, setContent] = React.useState("");
  const [category, setCategory] = React.useState("GENERAL");
  const [pending, startTransition] = React.useTransition();

  function submit() {
    if (!content.trim()) return;
    startTransition(async () => {
      try {
        await createPost(content, category);
        setContent("");
        setCategory("GENERAL");
        router.refresh();
        toast.success("Publié dans le fil du club !");
      } catch {
        toast.error("La publication a échoué.");
      }
    });
  }

  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex gap-3">
        <Avatar name={authorName} src={session?.user?.image} size="md" />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Quoi de neuf au club ? 🔴🔵"
            rows={2}
            className="w-full resize-none rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:border-club"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-lg border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-club"
            >
              {CATS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <Button size="sm" onClick={submit} disabled={pending || !content.trim()}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Publier
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
