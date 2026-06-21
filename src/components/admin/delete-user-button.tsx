"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { deleteUser } from "@/app/dashboard/admin/actions";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export function DeleteUserButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function handle() {
    if (!confirm) {
      setConfirm(true);
      setTimeout(() => setConfirm(false), 4000);
      return;
    }
    setBusy(true);
    const res = await deleteUser(userId);
    setBusy(false);
    if (res.error) { toast.error(res.error); setConfirm(false); return; }
    toast.success("Compte supprimé");
    router.refresh();
  }

  return (
    <button
      onClick={handle}
      disabled={busy}
      title="Supprimer ce compte"
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-lg border text-xs transition-colors",
        confirm
          ? "border-red-500/60 bg-red-500/15 text-red-400 font-bold"
          : "border-border text-muted-foreground hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400",
      )}
    >
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
    </button>
  );
}
