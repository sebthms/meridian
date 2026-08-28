/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // base is overridden to '/<REPO>/' via the GITHUB_PAGES environment variable
  // during the deploy workflow (see .github/workflows).
  base: process.env.GITHUB_PAGES === 'true' ? '/merise-diagrams/' : '/',
  server: {
    port: 5173,
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})