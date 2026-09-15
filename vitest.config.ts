import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: { '#shared': fileURLToPath(new URL('./shared', import.meta.url)) },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.{test,spec}.ts', 'server/**/*.{test,spec}.ts'],
  },
})
