/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // See DESIGN.md — palette + type system approved via /design-consultation.
      colors: {
        coral: { DEFAULT: "#FF6B4A", dark: "#E5502F" },
        teal: { DEFAULT: "#14B8A6", dark: "#0F766E" },
        cream: { DEFAULT: "#FFFBF7", card: "#FFFFFF" },
        ink: { DEFAULT: "#1C1917", soft: "#57534E", faint: "#A8A29E" },
        line: "#F0E6DD",
      },
      fontFamily: {
        display: ["Fredoka", "sans-serif"],
        body: ["Plus Jakarta Sans", "sans-serif"],
        data: ["DM Sans", "sans-serif"],
      },
      borderRadius: {
        sm: "10px",
        md: "16px",
        lg: "24px",
      },
      boxShadow: {
        card: "0 2px 10px rgba(28,25,23,0.06), 0 1px 2px rgba(28,25,23,0.04)",
        lift: "0 12px 30px rgba(28,25,23,0.10), 0 2px 6px rgba(28,25,23,0.06)",
      },
    },
  },
  darkMode: "media",
  plugins: [],
};
