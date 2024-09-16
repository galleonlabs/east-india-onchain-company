const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Bona Nova SC", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        "theme-pan-navy": " #27272A",
        "theme-pan-sky": " #0072B5",
        "theme-pan-champagne": " #F4EEE8",
      },
    },
  },
  plugins: [],
};
