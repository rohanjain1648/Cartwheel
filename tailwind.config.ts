import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#FAFAF8",
        "canvas-muted": "#F3F2EB",
        "canvas-subtle": "#EBEAE2",
        surface: "#FFFFFF",
        "surface-glass": "rgba(255, 255, 255, 0.85)",
        "brand-lime": "#BEF365",
        "brand-lime-hover": "#AEEB4E",
        "brand-lime-soft": "#F0FAC8",
        ink: {
          DEFAULT: "#181818",
          secondary: "#52525B",
          muted: "#71717A",
          faint: "#A1A1AA",
        },
        line: {
          DEFAULT: "rgba(24, 24, 24, 0.12)",
          strong: "rgba(24, 24, 24, 0.22)",
          subtle: "rgba(24, 24, 24, 0.06)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "sans-serif"],
        display: ["var(--font-display)", "Plus Jakarta Sans", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      boxShadow: {
        card: "0 12px 36px -18px rgba(24, 24, 24, 0.08), 0 2px 8px -2px rgba(24, 24, 24, 0.04)",
        "card-hover": "0 20px 48px -18px rgba(24, 24, 24, 0.14), 0 4px 12px -2px rgba(24, 24, 24, 0.06)",
        elevated: "0 24px 60px -24px rgba(24, 24, 24, 0.18)",
        glow: "0 0 24px -4px rgba(190, 243, 101, 0.45)",
      },
      borderRadius: {
        xl: "14px",
        "2xl": "18px",
        "3xl": "24px",
      },
    },
  },
  plugins: [],
};

export default config;
