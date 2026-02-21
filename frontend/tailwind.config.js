/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0f172a",
        card: "#1e293b",
        primary: "#6366f1",
        secondary: "#94a3b8",
        success: "#22c55e",
        danger: "#ef4444",
        warning: "#f59e0b",
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
