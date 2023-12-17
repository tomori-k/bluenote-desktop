/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        midnight: {
          950: '#07090A',
          900: '#0F1215',
          800: '#181C1F',
          700: '#20262A',
          600: '#282F35',
          500: '#303940',
          400: '#535E61',
          300: '#768181',
          200: '#99A2A0',
          100: '#BCC2C0',
          50: '#E0E3E1',
        },
      },
    },
  },
  plugins: [],
}
