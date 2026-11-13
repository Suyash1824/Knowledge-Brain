/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        experience: {
          badge: '#38bdf8', // sky
          border: '#0284c7',
          bg: '#082f49'
        },
        context: {
          badge: '#a855f7', // purple
          border: '#7e22ce',
          bg: '#3b0764'
        },
        knowledge: {
          badge: '#10b981', // emerald
          border: '#059669',
          bg: '#064e3b'
        }
      }
    },
  },
  plugins: [],
}
