import type { ExtensionVideoState, ImportedWatchState } from "../src/types/library";

export const BRIDGE_PROTOCOL_VERSION = 1 as const;
export const WEB_BRIDGE_CHANNEL = "AMAGIFLIX_WEB_TO_EXTENSION";
export const EXTENSION_BRIDGE_CHANNEL = "AMAGIFLIX_EXTENSION_TO_WEB";

interface RequestBase { protocolVersion: 1; requestId: string }

export type WebToExtensionMessage = RequestBase & (
  | { type: "AMAGIFLIX_PING" }
  | { type: "AMAGIFLIX_GET_STATES"; videoIds?: string[] }
  | { type: "AMAGIFLIX_IMPORT_HISTORY"; records: ImportedWatchState[] }
  | { type: "AMAGIFLIX_SET_MANUAL_WATCHED"; videoId: string; watched: boolean; changedAt: string }
  | { type: "AMAGIFLIX_RESET_PROGRESS"; videoId: string }
  | { type: "AMAGIFLIX_CLEAR_HISTORY_IMPORT" }
  | { type: "AMAGIFLIX_REFRESH_CATALOG"; catalogGeneratedAt?: string }
);

export type WebToExtensionInput = WebToExtensionMessage extends infer Message
  ? Message extends unknown ? Omit<Message, "protocolVersion" | "requestId"> : never
  : never;

interface ResponseBase { protocolVersion: 1; requestId: string }

export type ExtensionToWebMessage = ResponseBase & (
  | { type: "AMAGIFLIX_PONG"; extensionVersion: string }
  | { type: "AMAGIFLIX_STATES"; states: ExtensionVideoState[] }
  | { type: "AMAGIFLIX_ACK" }
  | { type: "AMAGIFLIX_ERROR"; code: string; message: string }
);

export type ExtensionToWebInput = ExtensionToWebMessage extends infer Message
  ? Message extends unknown ? Omit<Message, "protocolVersion" | "requestId"> : never
  : never;

export interface ExtensionStateEvent {
  protocolVersion: 1;
  type: "AMAGIFLIX_STATE_CHANGED";
  states: ExtensionVideoState[];
}

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const validDate = (value: unknown) => typeof value === "string" && Number.isFinite(Date.parse(value));
const WATCH_SOURCES = new Set(["extension", "history-import", "manual", "v1"]);

function validImportedState(value: unknown): value is ImportedWatchState {
  if (!value || typeof value !== "object") return false;
  const state = value as Record<string, unknown>;
  return typeof state.videoId === "string"
    && VIDEO_ID.test(state.videoId)
    && state.watched === true
    && Number.isInteger(state.importCount)
    && Number(state.importCount) > 0
    && validDate(state.importedAt)
    && (state.firstKnownWatchedAt === undefined || validDate(state.firstKnownWatchedAt))
    && (state.lastKnownWatchedAt === undefined || validDate(state.lastKnownWatchedAt));
}

function validManualDecision(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const decision = value as Record<string, unknown>;
  return typeof decision.watched === "boolean" && validDate(decision.changedAt);
}

function validMeasuredProgress(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const progress = value as Record<string, unknown>;
  return typeof progress.currentSeconds === "number"
    && Number.isFinite(progress.currentSeconds)
    && progress.currentSeconds >= 0
    && typeof progress.durationSeconds === "number"
    && Number.isFinite(progress.durationSeconds)
    && progress.durationSeconds > 0
    && progress.currentSeconds <= progress.durationSeconds
    && validDate(progress.measuredAt);
}

function validExtensionState(value: unknown): value is ExtensionVideoState {
  if (!value || typeof value !== "object") return false;
  const state = value as Record<string, unknown>;
  const optionalDates = ["firstStartedAt", "firstWatchedAt", "lastWatchedAt", "lastObservedAt"];
  return typeof state.videoId === "string"
    && VIDEO_ID.test(state.videoId)
    && typeof state.started === "boolean"
    && typeof state.watched === "boolean"
    && (state.progress === undefined || validMeasuredProgress(state.progress))
    && optionalDates.every((key) => state[key] === undefined || validDate(state[key]))
    && Array.isArray(state.sources)
    && state.sources.length <= WATCH_SOURCES.size
    && state.sources.every((source) => typeof source === "string" && WATCH_SOURCES.has(source))
    && (state.manualDecision === undefined || validManualDecision(state.manualDecision))
    && (state.historyImport === undefined || validImportedState(state.historyImport));
}

export function isWebToExtensionMessage(value: unknown): value is WebToExtensionMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Record<string, unknown>;
  if (message.protocolVersion !== 1 || typeof message.requestId !== "string" || message.requestId.length === 0 || message.requestId.length > 100) return false;
  switch (message.type) {
    case "AMAGIFLIX_PING":
    case "AMAGIFLIX_CLEAR_HISTORY_IMPORT": return true;
    case "AMAGIFLIX_GET_STATES": return message.videoIds === undefined || (Array.isArray(message.videoIds) && message.videoIds.length <= 5_000 && message.videoIds.every((id) => typeof id === "string" && VIDEO_ID.test(id)));
    case "AMAGIFLIX_IMPORT_HISTORY": return Array.isArray(message.records) && message.records.length <= 5_000 && message.records.every(validImportedState);
    case "AMAGIFLIX_SET_MANUAL_WATCHED": return VIDEO_ID.test(String(message.videoId)) && typeof message.watched === "boolean" && validDate(message.changedAt);
    case "AMAGIFLIX_RESET_PROGRESS": return VIDEO_ID.test(String(message.videoId));
    case "AMAGIFLIX_REFRESH_CATALOG": return message.catalogGeneratedAt === undefined || validDate(message.catalogGeneratedAt);
    default: return false;
  }
}

export function isExtensionToWebMessage(value: unknown): value is ExtensionToWebMessage | ExtensionStateEvent {
  if (!value || typeof value !== "object") return false;
  const message = value as Record<string, unknown>;
  if (message.protocolVersion !== 1 || typeof message.type !== "string") return false;
  if (message.type === "AMAGIFLIX_STATE_CHANGED") return Array.isArray(message.states) && message.states.length <= 5_000 && message.states.every(validExtensionState);
  if (typeof message.requestId !== "string" || message.requestId.length === 0 || message.requestId.length > 100) return false;
  switch (message.type) {
    case "AMAGIFLIX_PONG": return typeof message.extensionVersion === "string" && message.extensionVersion.length > 0 && message.extensionVersion.length <= 50;
    case "AMAGIFLIX_STATES": return Array.isArray(message.states) && message.states.length <= 5_000 && message.states.every(validExtensionState);
    case "AMAGIFLIX_ACK": return true;
    case "AMAGIFLIX_ERROR": return typeof message.code === "string" && message.code.length > 0 && message.code.length <= 100 && typeof message.message === "string" && message.message.length <= 500;
    default: return false;
  }
}
