"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { Heart, Loader2, MessageCircle, Send } from "lucide-react";
import type { FeedPost } from "@/lib/social";
import { addComment, toggleLike } from "@/app/dashboard/social/actions";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { ROLES } from "@/lib/enums";
import { cn } from "@/lib/utils";

const CAT_LABEL: Record<string, string> = {
  RESULTAT: "Résultat",
  MOMENT: "Moment fort",
  ANNONCE: "Annonce",
};

export function PostCard({ post }: { post: FeedPost }) {
  const router = useRouter();
  const [liked, setLiked] = React.useState(post.likedByMe);
  const [likeCount, setLikeCount] = React.useState(post.likeCount);
  const [showComments, setShowComments] = React.useState(false);
  const [comment, setComment] = React.useState("");
  const [pending, startTransition] = React.useTransition();

  function like() {
    setLiked((v) => !v);
    setLikeCount((c) => (liked ? c - 1 : c + 1));
    startTransition(async () => {
      await toggleLike(post.id);
    });
  }

  function send() {
    if (!comment.trim()) return;
    startTransition(async () => {
      await addComment(post.id, comment);
      setComment("");
      setShowComments(true);
      router.refresh();
    });
  }

  const cat = CAT_LABEL[post.category];

  return (
    <article className="rounded-2xl border bg-card p-5">
      <header className="flex items-center gap-3">
        <Avatar name={post.author.name} src={post.author.image} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold">{post.author.name}</span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {ROLES[post.author.role as keyof typeof ROLES] ?? post.author.role}
            </span>
          </div>
          <time className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: fr })}
          </time>
        </div>
        {cat && (
          <span className="rounded-full bg-club/10 px-2.5 py-1 text-xs font-semibold text-club">
            {cat}
          </span>
        )}
      </header>

      <p className="mt-3 whitespace-pre-wrap leading-relaxed">{post.content}</p>

      <div className="mt-4 flex items-center gap-1 border-t pt-3">
        <button
          onClick={like}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors hover:bg-secondary",
            liked ? "text-club" : "text-muted-foreground",
          )}
        >
          <Heart className={cn("size-4", liked && "fill-club")} />
          {likeCount}
        </button>
        <button
          onClick={() => setShowComments((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
        >
          <MessageCircle className="size-4" />
          {post.commentCount}
        </button>
      </div>

      {showComments && (
        <div className="mt-3 space-y-3 border-t pt-3">
          {post.comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <Avatar name={c.author.name} src={c.author.image} size="sm" />
              <div className="rounded-2xl bg-secondary/60 px-3 py-2">
                <p className="text-xs font-semibold">{c.author.name}</p>
                <p className="text-sm">{c.content}</p>
              </div>
            </div>
          ))}

          <div className="flex items-center gap-2">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Écrire un commentaire..."
              className="min-w-0 flex-1 rounded-full border bg-background px-4 py-2 text-sm outline-none focus:border-club"
            />
            <Button size="icon" variant="ghost" onClick={send} disabled={pending || !comment.trim()}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
