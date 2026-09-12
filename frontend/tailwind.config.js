/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        void: "#0b0b14",
        surface: "#12121e",
        surface2: "#191927",
        gold: "#e8b64f",
        arcane: "#8b5cf6",
        arcane2: "#6366f1",
      },
      fontFamily: {
        display: ["'Cinzel'", "serif"],
        body: ["'Inter'", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(139, 92, 246, 0.35)",
        goldGlow: "0 0 20px rgba(232, 182, 79, 0.35)",
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
