import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#E8EAF0",
          100: "#C5CAD9",
          200: "#9EA6C0",
          300: "#7782A7",
          400: "#596794",
          500: "#3B4C81",
          600: "#344479",
          700: "#2B3A6E",
          800: "#233064",
          900: "#1B2A5B",
          950: "#0F1A3D",
        },
        electric: {
          50: "#E0F7FA",
          100: "#B2EBF2",
          200: "#80DEEA",
          300: "#4DD0E1",
          400: "#26C6DA",
          500: "#00BCD4",
          600: "#00ACC1",
          700: "#0097A7",
          800: "#00838F",
          900: "#006064",
        },
        eco: {
          50: "#F1F8E9",
          100: "#DCEDC8",
          200: "#C5E1A5",
          300: "#AED581",
          400: "#9CCC65",
          500: "#8BC34A",
          600: "#7CB342",
          700: "#689F38",
          800: "#558B2F",
          900: "#33691E",
        },
      },
      fontFamily: {
        heading: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"],
        body: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        display: [
          "clamp(2.5rem, 5vw, 4rem)",
          { lineHeight: "1.1", fontWeight: "800" },
        ],
        h1: [
          "clamp(2rem, 4vw, 3rem)",
          { lineHeight: "1.15", fontWeight: "700" },
        ],
        h2: [
          "clamp(1.5rem, 3vw, 2.25rem)",
          { lineHeight: "1.2", fontWeight: "700" },
        ],
        h3: [
          "clamp(1.25rem, 2.5vw, 1.75rem)",
          { lineHeight: "1.3", fontWeight: "600" },
        ],
        h4: [
          "clamp(1.125rem, 2vw, 1.5rem)",
          { lineHeight: "1.35", fontWeight: "600" },
        ],
        "body-lg": ["1.125rem", { lineHeight: "1.6" }],
        body: ["1rem", { lineHeight: "1.6" }],
        "body-sm": ["0.875rem", { lineHeight: "1.5" }],
        caption: ["0.75rem", { lineHeight: "1.4" }],
      },
      spacing: {
        section: "clamp(4rem, 8vw, 8rem)",
        container: "clamp(1rem, 5vw, 7.5rem)",
      },
      maxWidth: {
        content: "1600px",
        narrow: "960px",
        wide: "1600px",
      },
      borderRadius: {
        card: "0.75rem",
        button: "0.5rem",
      },
      boxShadow: {
        card: "0 4px 6px -1px rgba(27, 42, 91, 0.08), 0 2px 4px -2px rgba(27, 42, 91, 0.05)",
        "card-hover":
          "0 10px 15px -3px rgba(27, 42, 91, 0.12), 0 4px 6px -4px rgba(27, 42, 91, 0.08)",
        nav: "0 2px 10px rgba(27, 42, 91, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
