/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          950: "#030712",
          900: "#0f172a",
          850: "#131e36",
          800: "#1e293b",
          700: "#334155"
        },
        cyan: {
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2"
        },
        emerald: {
          400: "#34d399",
          500: "#10b981",
          600: "#059669"
        }
      },
      boxShadow: {
        "neon-cyan": "0 0 20px -3px rgba(6, 182, 212, 0.35)",
        "neon-emerald": "0 0 20px -3px rgba(16, 185, 129, 0.35)",
        "glass": "0 8px 32px 0 rgba(0, 0, 0, 0.37)"
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      }
    },
  },
  plugins: [],
}
