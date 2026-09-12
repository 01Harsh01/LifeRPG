/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        void: "var(--bg-primary, #151c1c)",
        surface: "var(--bg-surface, #1e2726)",
        surface2: "var(--bg-surface2, #263231)",
        aliceBlue: "#dcedff",
        powderBlue: "#94b0da",
        lavenderGrey: "#8f91a2",
        charcoal: "#505a5b",
        ironGrey: "#343f3e",
        "alice-blue": "#dcedff",
        "powder-blue": "#94b0da",
        "lavender-grey": "#8f91a2",
        "iron-grey": "#343f3e",
        gold: "var(--gold-color, #dcedff)",
        arcane: "rgb(var(--color-arcane, 148 176 218) / <alpha-value>)",
        arcane2: "rgb(var(--color-arcane2, 80 90 91) / <alpha-value>)",
      },
      fontFamily: {
        display: ["'Cinzel'", "serif"],
        body: ["'Inter'", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 22px var(--glow-color, rgba(148, 176, 218, 0.35))",
        goldGlow: "0 0 20px rgba(220, 237, 255, 0.35)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        shimmer: "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};
