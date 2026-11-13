/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#050505',
          secondary: '#0A0A0D',
          elevated: '#111114',
          surface: '#15151A',
          card: '#0D0D11',
        },
        crimson: {
          50: '#FFF0F2',
          100: '#FFE1E5',
          200: '#FFC2CB',
          300: '#FFA3B1',
          400: '#FF657E',
          500: '#E63946', // Primary accent
          600: '#D62839',
          700: '#BA1B2B',
          glow: '#FF334F', // Secondary accent / glow
          dark: '#4A0D14',
          subtle: 'rgba(230, 57, 70, 0.12)',
        },
        technical: {
          DEFAULT: '#657BFF',
          glow: 'rgba(101, 123, 255, 0.25)',
          dark: '#1C244B',
        },
        text: {
          primary: '#F5F5F5',
          secondary: '#92929B',
          muted: '#5A5A64',
        },
        border: {
          subtle: 'rgba(255, 255, 255, 0.08)',
          DEFAULT: 'rgba(255, 255, 255, 0.10)',
          highlight: 'rgba(255, 255, 255, 0.18)',
          crimson: 'rgba(230, 57, 70, 0.35)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'crimson-glow': '0 0 35px -5px rgba(230, 57, 70, 0.35)',
        'crimson-strong': '0 0 60px -10px rgba(230, 57, 70, 0.65)',
        'crimson-subtle': '0 0 20px -3px rgba(230, 57, 70, 0.20)',
        'card-elevated': '0 10px 30px -10px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        'inner-glow': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.12)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 7s ease-in-out 2s infinite',
        'orbit-spin': 'spin 24s linear infinite',
        'orbit-spin-reverse': 'spin-reverse 32s linear infinite',
        'glow-breathe': 'glowBreathe 4s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'spin-reverse': {
          from: { transform: 'rotate(360deg)' },
          to: { transform: 'rotate(0deg)' },
        },
        glowBreathe: {
          '0%': { opacity: '0.4', filter: 'blur(20px)' },
          '100%': { opacity: '0.8', filter: 'blur(30px)' },
        }
      }
    },
  },
  plugins: [],
}

