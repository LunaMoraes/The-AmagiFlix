import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  root: __dirname,
  build: {
    outDir: "../extension-dist",
    emptyOutDir: false,
    sourcemap: false,
    rollupOptions: {
      input: resolve(__dirname, "src/app-bridge.ts"),
      output: {
        entryFileNames: "app-bridge.js",
        format: "iife",
        inlineDynamicImports: true,
      },
    },
  },
});
