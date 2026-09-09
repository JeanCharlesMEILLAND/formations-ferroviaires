import type { Config } from "tailwindcss";

/**
 * Identité « Formations ferroviaires », septembre 2026.
 * Les noms de palettes historiques (navy, electric, eco) sont conservés pour ne pas réécrire
 * les composants existants : leurs valeurs deviennent le bleu pétrole, le corail balise et le vert rail.
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // bleu pétrole (encre)
        navy: {
          50: "#F1F3F2",
          100: "#E4ECEF",
          200: "#D6DDE1",
          300: "#B7C6CE",
          400: "#6C7C88",
          500: "#4F6270",
          600: "#3C4E5C",
          700: "#253B49",
          800: "#12303F",
          900: "#0C1F2C",
          950: "#07111A",
        },
        // corail balise (action)
        electric: {
          50: "#FFEDE8",
          100: "#FFD6CB",
          200: "#FFB5A1",
          300: "#FF9376",
          400: "#FF7455",
          500: "#FF5A36",
          600: "#E84A28",
          700: "#C23B1E",
          800: "#9C2F18",
          900: "#7A2412",
        },
        // vert rail (vérifié, réussite)
        eco: {
          50: "#DDF3EA",
          100: "#BFE7D6",
          200: "#93D6BC",
          300: "#63C29F",
          400: "#3BAA84",
          500: "#1B8C6E",
          600: "#17795F",
          700: "#13634E",
          800: "#0F4D3D",
          900: "#0B392E",
        },
        // jaune signal (accent)
        signal: {
          50: "#FFF7D6",
          100: "#FFEFAD",
          200: "#FFE47A",
          300: "#FFD84D",
          400: "#F5C93A",
          500: "#E6B520",
          600: "#C99A10",
          700: "#A67D0A",
          800: "#7F5F06",
          900: "#5C4404",
        },
      },
      fontFamily: {
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        display: ["clamp(2.1rem, 3.9vw, 3.4rem)", { lineHeight: "1.02", fontWeight: "800", letterSpacing: "-0.02em" }],
        h1: ["clamp(2rem, 4vw, 3rem)", { lineHeight: "1.1", fontWeight: "800", letterSpacing: "-0.02em" }],
        h2: ["clamp(1.6rem, 3.2vw, 2.25rem)", { lineHeight: "1.1", fontWeight: "800", letterSpacing: "-0.02em" }],
        h3: ["clamp(1.15rem, 2.2vw, 1.5rem)", { lineHeight: "1.25", fontWeight: "700" }],
        h4: ["1.125rem", { lineHeight: "1.35", fontWeight: "700" }],
        "body-lg": ["1.125rem", { lineHeight: "1.55" }],
        body: ["1rem", { lineHeight: "1.55" }],
        "body-sm": ["0.875rem", { lineHeight: "1.5" }],
        caption: ["0.75rem", { lineHeight: "1.4" }],
      },
      spacing: {
        section: "clamp(3rem, 6vw, 5rem)",
        container: "clamp(1rem, 4vw, 3rem)",
      },
      maxWidth: {
        content: "1180px",
        narrow: "960px",
        wide: "1600px",
      },
      borderRadius: {
        card: "1rem",
        button: "999px",
      },
      boxShadow: {
        card: "0 6px 18px -6px rgba(12, 31, 44, 0.12)",
        "card-hover": "0 14px 40px rgba(12, 31, 44, 0.12)",
        nav: "0 2px 10px rgba(12, 31, 44, 0.08)",
        search: "0 20px 50px rgba(0, 0, 0, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
