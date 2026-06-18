/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          deep: "hsl(var(--primary-deep))",
          glow: "hsl(var(--primary-glow))",
        },
        card: "hsl(var(--card))",
        border: "hsl(var(--border))",
        success: "hsl(var(--success))",
        info: "hsl(var(--info))",
      },
      boxShadow: {
        xs: "var(--shadow-xs)",
        card: "var(--shadow-card)",
        elevated: "var(--shadow-elevated)",
      }
    },
  },
  plugins: [],
}