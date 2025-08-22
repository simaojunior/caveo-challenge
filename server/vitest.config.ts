import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ['**/*.{test,spec,e2e.test}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: 'verbose',
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html'],
      all: true,
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.e2e.test.ts', 'src/tests/**'],
    },
  },
});
