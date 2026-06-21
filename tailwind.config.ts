import type { Config } from "tailwindcss";

/**
 * Design system ASSJM
 * Couleurs tirées du logo : bleu marine profond, rouge vif, blanc.
 * Clin d'oeil au patrimoine passementier : nuance "cream" + motifs de rubans.
 */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        // Tokens sémantiques (shadcn) — pilotés par variables CSS
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Couleurs de marque ASSJM (valeurs brutes)
        navy: {
          DEFAULT: "#0E1E46",
          50: "#eef1f8",
          100: "#d4dbee",
          200: "#a9b6dd",
          300: "#7e92cc",
          400: "#5470bb",
          500: "#34539e",
          600: "#26417c",
          700: "#1a2f5b",
          800: "#0E1E46",
          900: "#08122c",
          950: "#040a1a",
        },
        club: {
          DEFAULT: "#E11D2A",
          50: "#fdeaec",
          100: "#fbd0d3",
          200: "#f6a1a8",
          300: "#f1727d",
          400: "#ec4452",
          500: "#E11D2A",
          600: "#b51722",
          700: "#88111a",
          800: "#5b0b11",
          900: "#2d0609",
        },
        cream: "#F6F2EA",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "calc(var(--radius) + 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
      },
      backgroundImage: {
        "ribbon-stripes":
          "repeating-linear-gradient(45deg, transparent, transparent 14px, hsl(var(--ribbon) / 0.06) 14px, hsl(var(--ribbon) / 0.06) 28px)",
        "navy-grid":
          "linear-gradient(hsl(var(--grid) / 0.5) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--grid) / 0.5) 1px, transparent 1px)",
        "radial-fade":
          "radial-gradient(ellipse at top, hsl(var(--glow) / 0.25), transparent 60%)",
      },
      boxShadow: {
        glow: "0 0 60px -15px rgba(225, 29, 42, 0.45)",
        "glow-navy": "0 0 60px -15px rgba(14, 30, 70, 0.55)",
        card: "0 10px 40px -12px rgba(8, 18, 44, 0.25)",
        "card-lg": "0 24px 70px -20px rgba(8, 18, 44, 0.45)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "ribbon-slide": {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "56px 56px" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "70%, 100%": { transform: "scale(1.6)", opacity: "0" },
        },
        "gradient-pan": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2.5s infinite",
        "ribbon-slide": "ribbon-slide 8s linear infinite",
        "pulse-ring": "pulse-ring 2.4s cubic-bezier(0.4,0,0.2,1) infinite",
        "gradient-pan": "gradient-pan 8s ease infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
