import { readdir, readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const dist = resolve("dist");
const extensionDist = resolve("extension-dist");
const secret = process.env.YOUTUBE_API_KEY;
const forbiddenRuntimeEndpoint = "youtube.googleapis.com/youtube/v3";

async function filesWithin(directory: string): Promise<string[]> {
  const entries = await readdir(directory);
  const files: string[] = [];
  for (const entry of entries) {
    const path = resolve(directory, entry);
    if ((await stat(path)).isDirectory()) files.push(...(await filesWithin(path)));
    else files.push(path);
  }
  return files;
}

for (const file of await filesWithin(dist)) {
  const contents = await readFile(file);
  const text = contents.toString("utf8");
  if (secret && contents.includes(Buffer.from(secret))) throw new Error(`YOUTUBE_API_KEY leaked into ${file}.`);
  if (text.includes(forbiddenRuntimeEndpoint)) throw new Error(`YouTube Data API endpoint leaked into ${file}.`);
}

for (const file of await filesWithin(extensionDist)) {
  const contents = await readFile(file);
  const text = contents.toString("utf8");
  if (secret && contents.includes(Buffer.from(secret))) throw new Error(`YOUTUBE_API_KEY leaked into ${file}.`);
  if (text.includes(forbiddenRuntimeEndpoint)) throw new Error(`YouTube Data API endpoint leaked into ${file}.`);
  if (/https?:\/\/[^"'`\s]+\.js\b/.test(text)) throw new Error(`Remote executable code reference found in ${file}.`);
}

const manifest = JSON.parse(await readFile(resolve(extensionDist, "manifest.json"), "utf8")) as Record<string, unknown>;
const permissions = [...(manifest.permissions as string[] ?? []), ...(manifest.host_permissions as string[] ?? [])];
for (const forbidden of ["history", "cookies", "tabs", "<all_urls>"]) if (permissions.includes(forbidden)) throw new Error(`Forbidden extension permission: ${forbidden}.`);
if (manifest.manifest_version !== 3) throw new Error("Companion extension must use Manifest V3.");
await stat(resolve(dist, "downloads", "amagiflix-companion.zip"));

const indexHtml = await readFile(resolve(dist, "index.html"), "utf8");
if (!indexHtml.includes('src="./assets/') || !indexHtml.includes('href="./assets/')) {
  throw new Error("Production assets must use relative URLs so GitHub Pages path casing remains portable.");
}

const browserJavaScript = await Promise.all(
  (await filesWithin(resolve(dist, "assets")))
    .filter((file) => file.endsWith(".js"))
    .map((file) => readFile(file, "utf8")),
);
if (!browserJavaScript.some((contents) => contents.includes("./data/catalog.json"))) {
  throw new Error("Catalog URL must remain relative to the deployed GitHub Pages project path.");
}

console.log("Web and extension builds use scoped paths/permissions and contain no catalog credential or runtime YouTube Data API endpoint.");
