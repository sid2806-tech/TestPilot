/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Hamza Desk Room Palette (https://www.raomuhammadhamza.tech/)
        navy: {
          950: '#090c15',
          900: '#0f1220', // Hamza's theme-color
          850: '#131728',
          800: '#181d33',
          700: '#222845',
          600: '#323a61',
        },
        rose: {
          400: '#ff70a6', // Hamza neon pink
          500: '#f43f5e',
          300: '#ffa1c5',
          200: '#ffd1e3',
          900: '#2b1422',
        },
        cyan: {
          400: '#38bdf8',
          500: '#0284c7',
        },
        amber: {
          glow: '#fb923c',
        },
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'neon-rose': '0 0 20px rgba(255, 112, 166, 0.25), 0 0 40px rgba(255, 112, 166, 0.1)',
        'desk-rim': '0 0 0 1px rgba(255, 112, 166, 0.25), 0 8px 32px rgba(0, 0, 0, 0.7)',
        'dock': '0 12px 35px -4px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.08)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
    },
  },
  plugins: [],
}
