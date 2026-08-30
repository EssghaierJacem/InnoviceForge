import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    env: {
      VITE_API_BASE_URL: 'http://localhost:8080',
      VITE_KEYCLOAK_ISSUER: 'http://localhost:8181/realms/invoiceforge',
    },
  },
})
