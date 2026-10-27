import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    include: ['test/products.database.integration.spec.ts'],
    testTimeout: 15000,
    hookTimeout: 15000,
  },
});
