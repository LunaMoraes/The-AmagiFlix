import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  root: __dirname,
  build: {
    outDir: "../extension-dist",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      input: {
        "service-worker": resolve(__dirname, "src/service-worker.ts"),
        "youtube-content": resolve(__dirname, "src/youtube-content.ts"),
        "app-bridge": resolve(__dirname, "src/app-bridge.ts"),
      },
      output: { entryFileNames: "[name].js", chunkFileNames: "chunks/[name]-[hash].js" },
    },
  },
});
