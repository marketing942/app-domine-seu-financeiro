import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1E3A5F",
          50: "#EBF0F7",
          100: "#C2D2E8",
          200: "#99B4D9",
          300: "#7096CA",
          400: "#4778BB",
          500: "#1E3A5F",
          600: "#182F4C",
          700: "#122439",
          800: "#0C1926",
          900: "#060E13",
        },
        accent: {
          DEFAULT: "#2E86AB",
          light: "#5BA4C4",
          dark: "#1A5F7A",
        },
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        income: "#10B981",
        expense: "#EF4444",
      },
    },
  },
  plugins: [],
};

export default config;
