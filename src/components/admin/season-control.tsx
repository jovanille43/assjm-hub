"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { closeSeason } from "@/app/dashboard/admin/actions";

export function SeasonControl() {
  const router = useRouter();
  const [confirm, setConfirm] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function onClick() {
    if (!confirm) {
      setConfirm(true);
      setTimeout(() => setConfirm(false), 5000);
      return;
    }
    setBusy(true);
    const res = await closeSeason();
    setBusy(false);
    setConfirm(false);
    if (res.error) return toast.error(res.error);
    toast.success("Saison clôturée — palmarès publié, points remis à zéro.");
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">
        Publie le palmarès (top 3) dans les actualités et remet à zéro les points
        de tous les membres. Badges et cartes sont conservés.
      </p>
      <Button
        variant={confirm ? "default" : "outline"}
        onClick={onClick}
        disabled={busy}
        className={confirm ? "bg-amber-500 hover:bg-amber-600" : ""}
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Trophy className="size-4" />}
        {confirm ? "Confirmer la clôture ?" : "Clôturer la saison"}
      </Button>
    </div>
  );
}
