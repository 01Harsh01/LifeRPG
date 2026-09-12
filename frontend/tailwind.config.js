/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        void: "var(--bg-primary, #0a210f)",
        surface: "var(--bg-surface, #0f2b16)",
        surface2: "var(--bg-surface2, #14381e)",
        evergreen: "#0a210f",
        darkSpruce: "#14591d",
        limeMoss: "#99aa38",
        paleAmber: "#e1e289",
        icyBlue: "#acd2ed",
        gold: "var(--gold-color, #e1e289)",
        arcane: "rgb(var(--color-arcane, 153 170 56) / <alpha-value>)",
        arcane2: "rgb(var(--color-arcane2, 20 89 29) / <alpha-value>)",
      },
      fontFamily: {
        display: ["'Cinzel'", "serif"],
        body: ["'Inter'", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 22px var(--glow-color, rgba(153, 170, 56, 0.35))",
        goldGlow: "0 0 20px rgba(225, 226, 137, 0.35)",
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
