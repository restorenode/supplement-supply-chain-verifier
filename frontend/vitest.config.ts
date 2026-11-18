import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Mirror the tsconfig path aliases so tests can import app modules that use "@/...".
const src = (path: string) => fileURLToPath(new URL(`./src/${path}`, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@/components": src("components"),
      "@/lib": src("lib"),
      "@/app": src("app")
    }
  },
  test: {
    include: ["tests/**/*.test.ts"]
  }
});
