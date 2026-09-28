import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    globals: true,
    restoreMocks: true,
    coverage: {
      reporter: ['text', 'json-summary'],
    },
  },
})

