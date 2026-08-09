import { strFromU8, Unzip, UnzipInflate } from "fflate";
import type { HistoryImportAdapter, ImportedWatchRecord } from "../types";
import { parseHtmlActivityText } from "./html-activity";
import { parseJsonActivityText } from "./json-activity";
import { readFileBytes } from "../file-io";

const MAX_ARCHIVE_BYTES = 2 * 1024 * 1024 * 1024;
const MAX_ENTRY_BYTES = 64 * 1024 * 1024;
const MAX_CANDIDATE_BYTES = 192 * 1024 * 1024;
const MAX_ENTRIES = 5_000;

async function unzipCandidateTexts(file: File): Promise<Array<{ name: string; text: string }>> {
  if (file.size > MAX_ARCHIVE_BYTES) throw new Error("This ZIP archive is too large to process safely.");
  const candidates: Array<{ name: string; text: string }> = [];
  let entryCount = 0;
  let candidateBytes = 0;
  let failure: Error | undefined;
  const unzip = new Unzip((entry) => {
    entryCount += 1;
    if (entryCount > MAX_ENTRIES) {
      failure = new Error("This ZIP archive contains too many files.");
      return;
    }
    if (!/\.(?:json|html?)$/i.test(entry.name)) return;
    const chunks: Uint8Array[] = [];
    let size = 0;
    entry.ondata = (error, chunk, final) => {
      if (error) { failure = error; return; }
      size += chunk.length;
      candidateBytes += chunk.length;
      if (size > MAX_ENTRY_BYTES || candidateBytes > MAX_CANDIDATE_BYTES) {
        failure = new Error("The ZIP contains history files that are too large to process safely.");
        return;
      }
      chunks.push(chunk);
      if (final) {
        const combined = new Uint8Array(size);
        let offset = 0;
        for (const part of chunks) { combined.set(part, offset); offset += part.length; }
        candidates.push({ name: entry.name, text: strFromU8(combined) });
      }
    };
    entry.start();
  });
  unzip.register(UnzipInflate);
  const stream = (file as File & { stream?: () => ReadableStream<Uint8Array> }).stream;
  if (typeof stream === "function") {
    const reader = stream.call(file).getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (failure) throw failure;
      unzip.push(value ?? new Uint8Array(), done);
      if (done) break;
    }
  } else {
    unzip.push(await readFileBytes(file), true);
  }
  if (failure) throw failure;
  return candidates;
}

export const takeoutZipAdapter: HistoryImportAdapter = {
  async canHandle(file) {
    return file.name.toLowerCase().endsWith(".zip") || file.type.includes("zip");
  },
  async parse(file) {
    const candidates = await unzipCandidateTexts(file);
    const records: ImportedWatchRecord[] = [];
    for (const candidate of candidates) {
      try {
        const parsed = candidate.name.toLowerCase().endsWith(".json")
          ? parseJsonActivityText(candidate.text)
          : parseHtmlActivityText(candidate.text);
        records.push(...parsed);
      } catch {
        // A Takeout archive can contain unrelated JSON/HTML files.
      }
    }
    return records;
  },
};
