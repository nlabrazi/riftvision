import { defineSharedVitestConfig } from '@nlabrazi/config-vitest'

export default defineSharedVitestConfig({
  rootDir: import.meta.url,
  include: ['tests/unit/**/*.{test,spec}.ts', 'server/**/*.{test,spec}.ts'],
  coverage: {
    exclude: ['**/*.wav'],
    thresholds: {
      lines: 80,
    },
  },
})
