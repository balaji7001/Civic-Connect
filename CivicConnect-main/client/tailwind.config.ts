import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        civic: {
          blue: "#1E3A8A",
          teal: "#0EA5A4",
          orange: "#F97316",
          green: "#16A34A",
          road: "#DC2626",
          purple: "#7C3AED",
          slate: "#0F172A",
        },
      },
      boxShadow: {
        soft: "0 18px 45px rgba(15, 23, 42, 0.12)",
      },
      backgroundImage: {
        hero: "radial-gradient(circle at top left, rgba(14, 165, 164, 0.22), transparent 36%), linear-gradient(135deg, rgba(30, 58, 138, 0.96), rgba(15, 23, 42, 0.96))",
      },
    },
  },
  plugins: [],
} satisfies Config;
