"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "1";
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function login(mail: string, pass: string) {
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email: mail,
      password: pass,
      redirect: false,
    });
    if (res?.error) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
      {justRegistered && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/15 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle className="size-4 shrink-0" />
          Compte créé avec succès ! Connectez-vous maintenant.
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          login(email, password);
        }}
        className="space-y-4"
      >
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-blue-100">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.fr"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-blue-100/40 focus:border-club"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-blue-100">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-blue-100/40 focus:border-club"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-club/15 px-4 py-2.5 text-sm text-club-100">
            {error}
          </p>
        )}

        <Button type="submit" disabled={loading} className="w-full" size="lg">
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          Se connecter
        </Button>
      </form>
    </div>
  );
}
