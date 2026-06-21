"use client";

import * as React from "react";
import { Download } from "lucide-react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};

export function PwaRegister() {
  const [deferred, setDeferred] = React.useState<InstallPromptEvent | null>(null);

  React.useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as InstallPromptEvent);
    };
    const onInstalled = () => setDeferred(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!deferred) return null;

  return (
    <button
      onClick={async () => {
        await deferred.prompt();
        await deferred.userChoice;
        setDeferred(null);
      }}
      className="fixed bottom-4 right-4 z-50 hidden items-center gap-2 rounded-full bg-club px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-105 md:inline-flex"
    >
      <Download className="size-4" /> Installer l'app
    </button>
  );
}
