import { deflateSync } from "node:zlib";
import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { basename, relative, resolve } from "node:path";
import { zipSync } from "fflate";

const extensionSource = resolve("extension");
const extensionDist = resolve("extension-dist");
const downloads = resolve("dist", "downloads");

function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array) {
  const typeBytes = Buffer.from(type, "ascii");
  const output = Buffer.alloc(12 + data.length);
  output.writeUInt32BE(data.length, 0);
  typeBytes.copy(output, 4);
  Buffer.from(data).copy(output, 8);
  output.writeUInt32BE(crc32(Buffer.concat([typeBytes, Buffer.from(data)])), 8 + data.length);
  return output;
}

function iconPng(size: number) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const radius = size * .16;
  const distanceToSegment = (x: number, y: number, ax: number, ay: number, bx: number, by: number) => {
    const length = (bx - ax) ** 2 + (by - ay) ** 2;
    const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / length));
    return Math.hypot(x - (ax + t * (bx - ax)), y - (ay + t * (by - ay)));
  };
  for (let y = 0; y < size; y += 1) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x += 1) {
      const nx = (x + .5) / size; const ny = (y + .5) / size;
      const cornerX = Math.max(radius - x, x - (size - radius), 0);
      const cornerY = Math.max(radius - y, y - (size - radius), 0);
      const inside = Math.hypot(cornerX, cornerY) <= radius;
      const stroke = Math.min(distanceToSegment(nx, ny, .25, .8, .5, .18), distanceToSegment(nx, ny, .5, .18, .75, .8));
      const crossbar = ny > .57 && ny < .65 && nx > .34 && nx < .66;
      const letter = stroke < .085 || crossbar;
      const offset = y * (size * 4 + 1) + 1 + x * 4;
      raw[offset] = letter ? 255 : 20;
      raw[offset + 1] = letter ? 255 : 20;
      raw[offset + 2] = letter ? 255 : 20;
      raw[offset + 3] = inside ? 255 : 0;
      if (inside && !letter && (x < size * .09 || y < size * .09)) { raw[offset] = 229; raw[offset + 1] = 9; raw[offset + 2] = 20; }
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4); header[8] = 8; header[9] = 6;
  return Buffer.concat([Buffer.from("89504e470d0a1a0a", "hex"), chunk("IHDR", header), chunk("IDAT", deflateSync(raw)), chunk("IEND", new Uint8Array())]);
}

await cp(resolve(extensionSource, "manifest.json"), resolve(extensionDist, "manifest.json"));
await mkdir(resolve(extensionDist, "icons"), { recursive: true });
for (const size of [16, 32, 48, 128]) await writeFile(resolve(extensionDist, "icons", `icon-${size}.png`), iconPng(size));

async function collect(directory: string): Promise<Record<string, Uint8Array>> {
  const files: Record<string, Uint8Array> = {};
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) Object.assign(files, await collect(path));
    else files[relative(extensionDist, path).replaceAll("\\", "/")] = await readFile(path);
  }
  return files;
}

const manifest = JSON.parse(await readFile(resolve(extensionDist, "manifest.json"), "utf8")) as Record<string, unknown>;
if (manifest.manifest_version !== 3 || basename(resolve(extensionDist, "manifest.json")) !== "manifest.json") throw new Error("Extension manifest is invalid.");
await mkdir(downloads, { recursive: true });
await writeFile(resolve(downloads, "amagiflix-companion.zip"), zipSync(await collect(extensionDist), { level: 9 }));
console.log("Packaged dist/downloads/amagiflix-companion.zip");
