const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        morion: ["Morion", "Inter var"],
        wigrum: ["Wigrum", "Inter var"],
      },
      colors: {
        "theme-champagne": "#FDE6C4",
        "theme-navy": "#040728",
        "theme-white": "#FFFFFF",
        "theme-oldlace": "#FEF3E2",
        "theme-sky": "#025BEE",
        "theme-aqua": "#59F4F4",
        "theme-copper": "#DC7F5A",
        "theme-pan-navy": "#27272A",
        "theme-pan-sky": "#0072B5",
        "theme-pan-champagne": "#F4EEE8",
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
