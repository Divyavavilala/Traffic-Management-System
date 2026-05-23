import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/providers/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "rgb(var(--surface) / <alpha-value>)",
          raised: "rgb(var(--surface-raised) / <alpha-value>)",
          overlay: "rgb(var(--surface-overlay) / <alpha-value>)",
        },
        foreground: {
          DEFAULT: "rgb(var(--foreground) / <alpha-value>)",
          muted: "rgb(var(--foreground-muted) / <alpha-value>)",
          subtle: "rgb(var(--foreground-subtle) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "#06b6d4",
          bright: "#22d3ee",
          muted: "#0891b2",
        },
        brand: {
          violet: "#8b5cf6",
          emerald: "#10b981",
          amber: "#f59e0b",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 48px -12px rgb(var(--glow) / 0.45)",
        "glow-sm": "0 0 24px -8px rgb(var(--glow) / 0.35)",
        card: "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
      },
      backgroundImage: {
        "hero-gradient": "var(--hero-gradient)",
        "mesh": "var(--mesh-gradient)",
      },
      animation: {
        "pulse-soft": "pulse-soft 2.5s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "fade-in": "fade-in 0.4s ease-out",
        "slide-up": "slide-up 0.45s ease-out",
        "count-tick": "count-tick 0.35s ease-out",
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px -4px rgb(var(--glow) / 0.4)" },
          "50%": { boxShadow: "0 0 32px -2px rgb(var(--glow) / 0.65)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "count-tick": {
          "0%": { transform: "scale(1.08)" },
          "100%": { transform: "scale(1)" },
        },
      },
      transitionDuration: {
        theme: "400ms",
      },
    },
  },
  plugins: [],
};

export default config;
