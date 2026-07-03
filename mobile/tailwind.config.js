/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        border: "#1E293B",
        input: "#1E293B",
        ring: "#CA5D1E",
        background: "#020817",
        foreground: "#F8FAFC",
        primary: {
          DEFAULT: "#3B82F6",
          foreground: "#0F172A",
        },
        secondary: {
          DEFAULT: "#1E293B",
          foreground: "#F8FAFC",
        },
        destructive: {
          DEFAULT: "#7F1D1D",
          foreground: "#F8FAFC",
        },
        muted: {
          DEFAULT: "#1E293B",
          foreground: "#64748B",
        },
        accent: {
          DEFAULT: "#1E293B",
          foreground: "#F8FAFC",
        },
        popover: {
          DEFAULT: "#020817",
          foreground: "#F8FAFC",
        },
        card: {
          DEFAULT: "#020817",
          foreground: "#F8FAFC",
        },
      }
    },
  },
  plugins: [],
}

