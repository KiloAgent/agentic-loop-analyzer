import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts", "skills/agentic-loop-analyzer/evals/**/*.test.ts"],
    environment: "node",
  },
});
