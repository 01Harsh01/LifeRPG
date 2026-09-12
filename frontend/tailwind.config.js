/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        void: "var(--bg-primary, #0a210f)",
        surface: "var(--bg-surface, #0e2614)",
        surface2: "var(--bg-surface2, #13331b)",
        evergreen: "#0a210f",
        "dark-spruce": "#14591d",
        darkSpruce: "#14591d",
        "lime-moss": "#99aa38",
        limeMoss: "#99aa38",
        "pale-amber": "#e1e289",
        paleAmber: "#e1e289",
        "icy-blue": "#acd2ed",
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
