"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BellRing, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { remindPending } from "@/app/dashboard/convocations/actions";

export function RemindButton({ matchId }: { matchId: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function remind() {
    setBusy(true);
    const res = await remindPending(matchId);
    setBusy(false);
    if (res.error) return toast.error(res.error);
    if (!res.count) return toast.info("Personne à relancer — tout le monde a répondu !");
    toast.success(`${res.count} joueur${res.count > 1 ? "s" : ""} relancé${res.count > 1 ? "s" : ""}`);
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={remind} disabled={busy}>
      {busy ? <Loader2 className="size-4 animate-spin" /> : <BellRing className="size-4" />}
      Relancer les absents
    </Button>
  );
}
