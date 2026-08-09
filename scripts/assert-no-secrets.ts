import { readdir, readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const dist = resolve("dist");
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

console.log("Public build contains no catalog credential or runtime YouTube Data API endpoint.");
