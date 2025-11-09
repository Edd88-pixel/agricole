/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'rgb(var(--brand-primary) / <alpha-value>)',
          accent: 'rgb(var(--brand-accent) / <alpha-value>)',
          secondary: 'rgb(var(--brand-secondary) / <alpha-value>)',
          background: 'rgb(var(--brand-background) / <alpha-value>)',
          surface: 'rgb(var(--brand-surface) / <alpha-value>)',
          text: 'rgb(var(--brand-text) / <alpha-value>)',
          muted: 'rgb(var(--brand-muted) / <alpha-value>)',
          danger: 'rgb(var(--brand-danger) / <alpha-value>)',
          warning: 'rgb(var(--brand-warning) / <alpha-value>)',
          bright: 'rgb(var(--brand-bright) / <alpha-value>)'
        }
      },
      boxShadow: {
        card: '0px 8px 20px rgba(11, 30, 20, 0.08)'
      },
      borderColor: {
        subtle: 'rgb(var(--brand-border-subtle) / <alpha-value>)'
      }
    }
  }
};
