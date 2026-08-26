/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./*.html",
    "./pages/**/*.{html,js}",
    "./assets/js/**/*.js",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        darkSlate: '#0F172A',
        deepIndigo: '#1E1B4B',
        accentCyan: '#00F5D4',
        brand: {
          50: '#f0fdfa',
          500: '#14b8a6',
          900: '#134e4a',
        }
      }
    },
  },
  plugins: [],
}
