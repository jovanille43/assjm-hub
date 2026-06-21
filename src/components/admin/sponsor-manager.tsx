"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Handshake, Loader2, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { createSponsor, deleteSponsor } from "@/app/dashboard/admin/actions";

type Sponsor = {
  id: string;
  name: string;
  logo: string | null;
  url: string | null;
  tier: string;
};

const TIERS = [
  { v: "PLATINUM", l: "Platine" },
  { v: "GOLD", l: "Or" },
  { v: "SILVER", l: "Argent" },
  { v: "PARTNER", l: "Partenaire" },
];

const tierLabel = (v: string) => TIERS.find((t) => t.v === v)?.l ?? "Partenaire";

export function SponsorManager({ sponsors }: { sponsors: Sponsor[] }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [deleting, setDeleting] = React.useState<string | null>(null);
  const formRef = React.useRef<HTMLFormElement | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    const res = await createSponsor(fd);
    setBusy(false);
    if (res?.error) return toast.error(res.error);
    toast.success("Sponsor ajouté");
    formRef.current?.reset();
    router.refresh();
  }

  async function onDelete(id: string, name: string) {
    if (!window.confirm(`Supprimer le sponsor « ${name} » ?`)) return;
    setDeleting(id);
    const res = await deleteSponsor(id);
    setDeleting(null);
    if (res?.error) return toast.error(res.error);
    toast.success("Sponsor supprimé");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {sponsors.length > 0 && (
        <div className="space-y-2">
          {sponsors.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 rounded-xl border bg-secondary/20 p-2.5"
            >
              <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg border bg-white">
                {s.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.logo} alt={s.name} className="size-full object-contain" />
                ) : (
                  <Handshake className="size-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{s.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {tierLabel(s.tier)}
                  {s.url ? ` · ${s.url.replace(/^https?:\/\//, "")}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onDelete(s.id, s.name)}
                disabled={deleting === s.id}
                aria-label={`Supprimer ${s.name}`}
                className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
              >
                {deleting === s.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Trash2 className="size-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="space-y-3 rounded-xl border border-dashed p-3"
      >
        <input
          type="text"
          name="name"
          placeholder="Nom de l'entreprise"
          required
          className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-club"
        />
        <input
          type="url"
          name="url"
          placeholder="Site web (optionnel) — https://…"
          className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-club"
        />
        <select
          name="tier"
          defaultValue="PARTNER"
          className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm outline-none focus:border-club"
        >
          {TIERS.map((t) => (
            <option key={t.v} value={t.v}>
              {t.l}
            </option>
          ))}
        </select>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">
            Logo de l'entreprise (PNG, JPG, WEBP)
          </label>
          <input
            type="file"
            name="logo"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium"
          />
        </div>
        <Button type="submit" size="sm" disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          Ajouter le sponsor
        </Button>
      </form>
    </div>
  );
}
