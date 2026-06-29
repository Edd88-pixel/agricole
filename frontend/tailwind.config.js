import daisyui from 'daisyui';

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
  },
  plugins: [daisyui],
  daisyui: {
    logs: false,
    themes: [
      {
        agrisense: {
          primary: '#0B6E4F',
          'primary-content': '#F6FBF7',
          secondary: '#107C8C',
          'secondary-content': '#F2FBFF',
          accent: '#2AAE66',
          neutral: '#0B1F14',
          'neutral-content': '#F1F7F4',
          'base-100': '#FFFFFF',
          'base-200': '#F6FBF7',
          'base-300': '#E1EEE7',
          'base-content': '#0B1F14',
          info: '#2AAE66',
          success: '#2AAE66',
          warning: '#F29C1F',
          error: '#E24B4B'
        }
      },
      'dark'
    ]
  }
};
