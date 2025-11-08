/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#0B6E4F',
          accent: '#2AAE66',
          secondary: '#107C8C',
          background: '#F6FBF7',
          surface: '#FFFFFF',
          text: '#0B1F14',
          muted: '#5B6B63',
          danger: '#E24B4B',
          warning: '#F29C1F',
          bright: '#FFC857'
        }
      },
      boxShadow: {
        card: '0px 8px 20px rgba(11, 30, 20, 0.08)'
      },
      borderColor: {
        subtle: 'rgba(11, 30, 20, 0.06)'
      }
    }
  }
};
