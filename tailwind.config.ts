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
        sans: ["Poppins", "system-ui", "sans-serif"],
        display: ["Playfair Display", "serif"],
      },
      colors: {
        bg: "#FFF9F7",
        surface: "#FFFFFF",
        border: "#F0D4CC",
        text: "#4A3228",
        accent: "#E88FAA",
      },
    },
  },
  plugins: [],
};

export default config;
