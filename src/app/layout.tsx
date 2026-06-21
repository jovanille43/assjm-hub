import type { Metadata, Viewport } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "@/components/session-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PwaRegister } from "@/components/pwa-register";
import { Toaster } from "@/components/ui/toast";
import { siteConfig } from "@/lib/site";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "ASSJM HUB — AS Saint-Just-Malmont",
    template: "%s · ASSJM HUB",
  },
  description: siteConfig.description,
  applicationName: "ASSJM HUB",
  keywords: ["ASSJM", "Saint-Just-Malmont", "football", "club amateur", "Haute-Loire"],
  authors: [{ name: "ASSJM" }],
  alternates: { canonical: "/" },
  openGraph: {
    title: "ASSJM HUB — AS Saint-Just-Malmont",
    description: "Le cœur numérique du club. Actualités, résultats, communauté.",
    type: "website",
    locale: "fr_FR",
    siteName: "ASSJM HUB",
    url: siteConfig.url,
    images: [
      { url: "/og.png", width: 1200, height: 630, alt: "ASSJM HUB — AS Saint-Just-Malmont" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ASSJM HUB — AS Saint-Just-Malmont",
    description: "Le cœur numérique du club. Actualités, résultats, communauté.",
    images: ["/og.png"],
  },
  icons: { icon: "/icon.svg", apple: "/apple-icon.png" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1733" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} ${oswald.variable} font-sans`}>
        <SessionProvider session={session}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <SiteHeader />
            <main className="min-h-screen">{children}</main>
            <SiteFooter />
            <PwaRegister />
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
