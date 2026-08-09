import type { HistoryImportAdapter, ImportedWatchRecord } from "../types";
import { readFileText } from "../file-io";

const MAX_TEXT_BYTES = 128 * 1024 * 1024;

const strings = (value: unknown): string[] => Array.isArray(value)
  ? value.filter((item): item is string => typeof item === "string")
  : typeof value === "string" ? [value] : [];

export function parseJsonActivity(value: unknown): ImportedWatchRecord[] {
  const records: ImportedWatchRecord[] = [];
  const visit = (node: unknown, depth: number) => {
    if (depth > 8 || !node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const item of node) visit(item, depth + 1);
      return;
    }
    const item = node as Record<string, unknown>;
    const title = typeof item.title === "string" ? item.title : undefined;
    const url = typeof item.titleUrl === "string" ? item.titleUrl : typeof item.url === "string" ? item.url : undefined;
    if (title || url) {
      records.push({
        ...(title ? { title } : {}),
        ...(url ? { url } : {}),
        ...(typeof item.time === "string" ? { time: item.time } : {}),
        products: strings(item.products),
        activityControls: [...strings(item.activityControls), ...strings(item.activityControl)],
      });
      return;
    }
    for (const child of Object.values(item)) visit(child, depth + 1);
  };
  visit(value, 0);
  return records;
}

export function parseJsonActivityText(text: string): ImportedWatchRecord[] {
  try {
    return parseJsonActivity(JSON.parse(text));
  } catch {
    throw new Error("The JSON history file is malformed.");
  }
}

export const jsonActivityAdapter: HistoryImportAdapter = {
  async canHandle(file) {
    return file.name.toLowerCase().endsWith(".json") || file.type.includes("json");
  },
  async parse(file) {
    if (file.size > MAX_TEXT_BYTES) throw new Error("This JSON file is too large to process safely.");
    return parseJsonActivityText(await readFileText(file));
  },
};
