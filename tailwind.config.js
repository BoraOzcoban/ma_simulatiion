/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        panel: '0 10px 40px rgba(0, 0, 0, 0.15)'
      }
    }
  },
  plugins: []
};
