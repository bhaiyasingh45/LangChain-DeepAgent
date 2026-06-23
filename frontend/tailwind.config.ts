import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cc: {
          bg:       "#0d0d0d",
          surface:  "#161616",
          elevated: "#1e1e1e",
          border:   "#2a2a2a",
          muted:    "#3d3d3d",
          text:     "#e8e8e8",
          dim:      "#888888",
          amber:    "#D4A853",
          green:    "#4ade80",
          red:      "#f87171",
          blue:     "#60a5fa",
          yellow:   "#facc15",
          purple:   "#c084fc",
        },
      },
      fontFamily: {
        mono: ["Menlo", "Monaco", '"Courier New"', "monospace"],
      },
    },
  },
  plugins: [typography],
};
export default config;
