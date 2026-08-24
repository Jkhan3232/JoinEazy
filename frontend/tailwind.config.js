/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          ink: '#14324a',
          sand: '#f4efe7',
          clay: '#c85f2c',
          teal: '#0f766e',
          mint: '#ddf8f1',
          blush: '#fbe6da',
          line: '#d7d0c4',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      boxShadow: {
        float: '0 24px 80px rgba(20, 50, 74, 0.12)',
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        rise: 'rise 0.45s ease-out forwards',
      },
    },
  },
  plugins: [],
};
