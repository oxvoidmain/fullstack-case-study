/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      colors: {
        kiln: {
          orange: '#FF6B35',
          blue: '#4A90E2',
          purple: '#9B59B6',
        }
      },
      fontSize: {
        '4xl': ['2.5rem', { lineHeight: '1.2' }],
      }
    },
  },
  plugins: [],
}
