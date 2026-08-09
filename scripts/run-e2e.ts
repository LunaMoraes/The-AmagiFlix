import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { createServer } from "vite";
import { e2eCatalog } from "../tests/e2e/e2e-catalog";

const host = "127.0.0.1";
const port = 5173;
const server = await createServer({
  server: { host, port, strictPort: true },
  logLevel: "error",
  plugins: [
    {
      name: "amagiflix-e2e-catalog",
      configureServer(viteServer) {
        viteServer.middlewares.use((request, response, next) => {
          if (request.url?.split("?", 1)[0] !== "/data/catalog.json") {
            next();
            return;
          }

          response.statusCode = 200;
          response.setHeader("Content-Type", "application/json; charset=utf-8");
          response.setHeader("Cache-Control", "no-store");
          response.end(JSON.stringify(e2eCatalog));
        });
      },
    },
  ],
});

try {
  await server.listen();
  const exitCode = await new Promise<number>((resolveExit, reject) => {
    const child = spawn(process.execPath, [resolve("node_modules", "@playwright", "test", "cli.js"), "test", ...process.argv.slice(2)], {
      cwd: process.cwd(),
      env: { ...process.env, PLAYWRIGHT_EXTERNAL_SERVER: "1" },
      stdio: "inherit",
      windowsHide: true,
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => resolveExit(code ?? (signal ? 1 : 0)));
  });
  process.exitCode = exitCode;
} finally {
  await server.close();
}
