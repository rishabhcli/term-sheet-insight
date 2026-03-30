import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/App.tsx",
        "src/components/NavLink.tsx",
        "src/components/ui/**",
        "src/features/term-sheet-tarot/domain/types.ts",
        "src/hooks/**",
        "src/integrations/supabase/types.ts",
        "src/integrations/supabase/client.ts",
        "src/lib/utils.ts",
        "src/main.tsx",
        "src/test/**",
        "src/vite-env.d.ts",
      ],
      thresholds: {
        branches: 60,
        functions: 70,
        lines: 70,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
