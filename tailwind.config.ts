// file: tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ["Share Tech Mono", "monospace"],
        display: ["Orbitron", "monospace"],
      },
      colors: {
        bg: "#080808",
        surface: "#0f0f0f",
        border: "#2a2a2a",
        text: "#e8e8e8",
      },
    },
  },
  plugins: [],
};

export default config;
