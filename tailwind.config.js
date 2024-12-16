/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        customGreen: "#2E8B57",
        primary: {
          DEFAULT: "#2563eb", // Blue-600
          light: "#60a5fa", // Blue-400
          dark: "#1d4ed8", // Blue-700
        },
        secondary: {
          DEFAULT: "#64748b", // Slate-500
          light: "#94a3b8", // Slate-400
          dark: "#475569", // Slate-600
        }
      },
    },
  },
  plugins: [],
};
