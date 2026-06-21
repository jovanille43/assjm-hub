"use client";

import * as React from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { resetUserPassword } from "@/app/dashboard/admin/actions";
import { cn } from "@/lib/utils";

export function ResetPasswordButton({ userId }: { userId: string }) {
  const [confirm, setConfirm] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function onClick() {
    if (!confirm) {
      setConfirm(true);
      setTimeout(() => setConfirm(false), 4000);
      return;
    }
    setBusy(true);
    const res = await resetUserPassword(userId);
    setBusy(false);
    setConfirm(false);
    if (res.error) return toast.error(res.error);
    if (res.password) {
      try {
        await navigator.clipboard.writeText(res.password);
      } catch {}
      toast.success(`Nouveau mot de passe : ${res.password}`, {
        description: "Copié dans le presse-papier — transmets-le au membre.",
        duration: 15000,
      });
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={busy}
      title="Réinitialiser le mot de passe"
      className={cn(
        "inline-flex h-8 items-center gap-1 rounded-lg border px-2 text-xs font-medium transition-colors hover:border-club",
        confirm && "border-amber-500 bg-amber-500/10 text-amber-500",
      )}
    >
      {busy ? <Loader2 className="size-3.5 animate-spin" /> : <KeyRound className="size-3.5" />}
      {confirm ? "Confirmer ?" : "MDP"}
    </button>
  );
}
