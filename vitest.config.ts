import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
    alias: {
      // Stub the real `react-native` package — its index.js re-exports
      // Flow type definitions that vite can't transform. The stub at
      // src/test/react-native-stub.ts provides just enough surface for
      // component tests under @testing-library/react.
      'react-native': resolve(__dirname, 'src/test/react-native-stub.ts'),
    },
  },
});
