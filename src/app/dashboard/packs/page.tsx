import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Coins, Gift, Target, Trophy } from "lucide-react";
import { auth } from "@/auth";
import { PageHeader } from "@/components/dashboard/page-header";
import { PackOpener } from "@/components/packs/pack-opener";
import { getPackStatus } from "@/app/dashboard/packs/actions";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Packs & récompenses" };

const CONTENT = [
  { icon: "🪙", label: "Points", desc: "La monnaie du club : améliore ta carte FUT et ouvre des packs Pro/Élite." },
  { icon: "🎯", label: "Boost Prono ×2", desc: "Double les points gagnés sur ton prochain pronostic de match." },
  { icon: "🏆", label: "Jackpot", desc: "Le gros lot légendaire : une montagne de points d'un coup." },
];

const ODDS = [
  { pack: "Standard", cost: "Gratuit · 3/sem", rows: "60% · 26% · 10% · 4%" },
  { pack: "Pro", cost: "100 pts", rows: "— · 60% · 30% · 10%" },
  { pack: "Élite", cost: "250 pts", rows: "— · — · 70% · 30%" },
];

export default async function PacksPage() {
  const session = await auth();
  if (!session?.user) redirect("/connexion");

  const status = await getPackStatus();

  const inventory = [
    { icon: Coins, label: "Points", value: status.userPoints, color: "text-club" },
    { icon: Target, label: "Boosts Prono", value: status.pronoBoosts, color: "text-emerald-400" },
  ];

  return (
    <div className="container max-w-3xl pb-8 pt-8 md:pb-16">
      <Link
        href="/dashboard/jeux"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Tous les jeux
      </Link>
      <PageHeader
        eyebrow="Récompenses"
        icon={Gift}
        title="Packs & récompenses"
        subtitle="Ouvre des packs pour gagner des points et des boosts Prono — puis fais évoluer ta carte FUT."
      />

      {/* Inventaire */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        {inventory.map((it) => (
          <Card key={it.label} className="flex flex-col items-center gap-1 p-4 text-center">
            <it.icon className={`size-5 ${it.color}`} />
            <span className="font-display text-2xl font-extrabold tabular-nums">{it.value}</span>
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {it.label}
            </span>
          </Card>
        ))}
      </div>

      <PackOpener
        weeklyUsed={status.weeklyUsed}
        weeklyMax={status.weeklyMax}
        userPoints={status.userPoints}
      />

      {/* Contenu des packs */}
      <section className="mt-10">
        <h2 className="mb-3 flex items-center gap-2 font-display text-xl font-bold">
          <Trophy className="size-5 text-club" /> Ce que contiennent les packs
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {CONTENT.map((c) => (
            <Card key={c.label} className="flex items-start gap-3 p-4">
              <span className="text-3xl">{c.icon}</span>
              <div>
                <p className="font-semibold">{c.label}</p>
                <p className="text-xs text-muted-foreground">{c.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Chances */}
      <section className="mt-8">
        <h2 className="mb-3 font-display text-xl font-bold">Chances par pack</h2>
        <div className="overflow-hidden rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Pack</th>
                <th className="px-3 py-2 text-left font-semibold">Coût</th>
                <th className="px-3 py-2 text-right font-semibold">Com · Rare · Épq · Lég</th>
              </tr>
            </thead>
            <tbody>
              {ODDS.map((o, i) => (
                <tr key={o.pack} className={i % 2 ? "bg-secondary/20" : ""}>
                  <td className="px-3 py-2 font-semibold">{o.pack}</td>
                  <td className="px-3 py-2 text-muted-foreground">{o.cost}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{o.rows}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Plus la rareté est élevée, plus la récompense est généreuse.
        </p>
      </section>
    </div>
  );
}
