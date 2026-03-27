import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    exclude: [
      '.agentstation/**',
      'node_modules/**',
    ],
  },
})
