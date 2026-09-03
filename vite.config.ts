/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  // En production (GitHub Pages), on utilise un base relatif ('./') afin que
  // les assets se résolvent quel que soit le sous-chemin du dépôt
  // (projet GitHub Pages servi sous /<repo>/). Le base est donc indépendant
  // du nom du dépôt.
  base: './',
  server: {
    port: 5173,
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
