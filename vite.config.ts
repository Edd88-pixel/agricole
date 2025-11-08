import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    coverage: {
      reporter: ['text', 'html'],
      statements: 0,
      exclude: [
        'tailwind.config.js',
        'postcss.config.js',
        'src/main.tsx',
        'src/app/**/*',
        'src/components/**/*',
        'src/features/**/components/**/*',
        'src/features/**/services/*.tsx',
        'src/features/**/types/**/*',
        'src/services/**/*',
        'src/styles/**/*'
      ]
    }
  }
});
