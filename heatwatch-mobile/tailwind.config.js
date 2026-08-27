/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        municipal: {
          blue: '#1e3a8a', // deep blue
          sky: '#0ea5e9',  // sky blue
          accent: '#38bdf8',
        },
        heat: {
          low: '#10b981',    // green-500
          moderate: '#f59e0b', // amber-500
          high: '#f97316',    // orange-500
          severe: '#ef4444',   // red-500
          extreme: '#7c3aed',  // violet-600
          danger: '#dc2626',   // red-600
        },
        weather: {
          sunny: '#0ea5e9',
          cloudy: '#64748b',
          rainy: '#3b82f6',
          night: '#1e1b4b',
          bg: '#f8fafc',    // light blue-grey base
        }
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '3rem',
      },
      backdropBlur: {
        xs: '2px',
        '2xl': '40px',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'subtle-drift': 'drift 20s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        drift: {
          '0%': { transform: 'translate(0, 0) scale(1)' },
          '100%': { transform: 'translate(5%, 5%) scale(1.1)' },
        }
      }
    },
  },
  plugins: [],
}
