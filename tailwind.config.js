/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: {
          950: '#060913',
          900: '#0b1020',
          850: '#10182b',
          800: '#151f34',
          750: '#1b2740',
        },
        brand: {
          cyan: '#22d3ee',
          blue: '#3b82f6',
          violet: '#8b5cf6',
          purple: '#a855f7',
        },
      },
      boxShadow: {
        glow: '0 0 45px rgba(34, 211, 238, 0.24)',
        violet: '0 0 45px rgba(139, 92, 246, 0.22)',
        panel: '0 24px 70px rgba(0, 0, 0, 0.38)',
        lift: '0 20px 70px rgba(15, 23, 42, 0.35)',
      },
      backgroundImage: {
        'app-radial':
          'radial-gradient(circle at top left, rgba(59, 130, 246, 0.18), transparent 28%), radial-gradient(circle at top right, rgba(168, 85, 247, 0.14), transparent 26%), linear-gradient(135deg, #060913 0%, #0b1020 48%, #10182b 100%)',
        'premium-surface':
          'linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.82))',
        'accent-line':
          'linear-gradient(90deg, rgba(34,211,238,0.95), rgba(59,130,246,0.75), rgba(139,92,246,0.9))',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '50%': { transform: 'translate3d(0, -14px, 0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-700px 0' },
          '100%': { backgroundPosition: '700px 0' },
        },
        aurora: {
          '0%, 100%': { transform: 'translateX(-4%) scale(1)' },
          '50%': { transform: 'translateX(4%) scale(1.03)' },
        },
      },
      animation: {
        float: 'float 7s ease-in-out infinite',
        shimmer: 'shimmer 1.8s linear infinite',
        aurora: 'aurora 16s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
