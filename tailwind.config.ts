import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        poker: {
          felt: "#0d5c3a",
          "felt-dark": "#073b24",
          rail: "#1a130f",
          gold: "#d4af37",
          chip: {
            red: "#dc2626",
            blue: "#2563eb",
            green: "#16a34a",
            black: "#18181b",
          },
        },
      },
    },
  },
  plugins: [],
};
export default config;
