import { defineConfig, globalIgnores } from 'eslint/config'
import { tanstackConfig } from '@tanstack/eslint-config'
import convexPlugin from '@convex-dev/eslint-plugin'

export default defineConfig([
  ...tanstackConfig,
  ...convexPlugin.configs.recommended,
  globalIgnores([
    'convex/_generated',
    // reference-only folders
    'convex-copy/**',
    'vite-src/**',
    // leave for later
    'src/components/ai-elements/**',
  ]),
  {
    rules: {
      'import/order': 'off',
      'sort-imports': 'off',
      'import/consistent-type-specifier-style': 'off',
    },
  },
])
