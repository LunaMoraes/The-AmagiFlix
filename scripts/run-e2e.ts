import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { createServer } from "vite";

const host = "127.0.0.1";
const port = 5173;
const server = await createServer({
  server: { host, port, strictPort: true },
  logLevel: "error",
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
