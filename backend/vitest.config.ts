import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false, // Ensures in-band sequential execution for database test safety
  },
});

