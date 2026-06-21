"use client";

/**
 * Filet de sécurité ultime : ne s'affiche que si le layout racine lui-même
 * échoue. Il remplace <html>/<body>, donc tout est en styles inline pour
 * rester correct même sans CSS chargée.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0a1733",
          color: "#eef3fb",
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          padding: "2rem",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <div style={{ fontSize: "2.5rem" }}>⚽</div>
          <h1 style={{ fontSize: "1.6rem", margin: "1rem 0 0.5rem" }}>
            Le service est momentanément indisponible
          </h1>
          <p style={{ color: "#9fb2d4", lineHeight: 1.6, margin: 0 }}>
            Une erreur inattendue a interrompu l'application. Merci de réessayer.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "1.75rem",
              cursor: "pointer",
              border: "none",
              borderRadius: "9999px",
              background: "#e11d2a",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.95rem",
              padding: "0.75rem 1.75rem",
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
