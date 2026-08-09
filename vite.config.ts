import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/theamagiflix/" : "/",
  plugins: [react()],
  build: {
    sourcemap: true,
  },
}));
