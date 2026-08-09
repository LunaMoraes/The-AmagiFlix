import { BRIDGE_PROTOCOL_VERSION, isWebToExtensionMessage, type ExtensionToWebInput, type ExtensionToWebMessage, type WebToExtensionMessage } from "../../shared/bridge-protocol";
import type { ImportedWatchState } from "../../src/types/library";
import { getCatalogVideoIds, isCatalogVideo, refreshCatalog } from "./catalog-cache";
import { applyTrackerCheckpoint, clearImported, loadStore, mergeImported, resetVideoProgress, setManualDecision, type TrackerCheckpoint } from "./storage";

const APP_URL = /^https:\/\/theamagiflix\.com(?:\/|$)/;
const appPorts = new Set<chrome.runtime.Port>();

const response = (requestId: string, message: ExtensionToWebInput): ExtensionToWebMessage => ({ ...message, protocolVersion: BRIDGE_PROTOCOL_VERSION, requestId } as ExtensionToWebMessage);

async function allStates(videoIds?: string[]) {
  const store = await loadStore();
  const allowed = videoIds ? new Set(videoIds) : undefined;
  return Object.values(store.videos).filter((state) => !allowed || allowed.has(state.videoId));
}

async function broadcastStates() {
  const message = { type: "AMAGIFLIX_STATE_CHANGED", protocolVersion: BRIDGE_PROTOCOL_VERSION, states: await allStates() } as const;
  for (const port of appPorts) try { port.postMessage(message); } catch { appPorts.delete(port); }
}

async function handleWebMessage(message: WebToExtensionMessage): Promise<ExtensionToWebMessage> {
  try {
    switch (message.type) {
      case "AMAGIFLIX_PING": return response(message.requestId, { type: "AMAGIFLIX_PONG", extensionVersion: chrome.runtime.getManifest().version });
      case "AMAGIFLIX_GET_STATES": return response(message.requestId, { type: "AMAGIFLIX_STATES", states: await allStates(message.videoIds) });
      case "AMAGIFLIX_IMPORT_HISTORY": await mergeImported(message.records as ImportedWatchState[]); break;
      case "AMAGIFLIX_SET_MANUAL_WATCHED": await setManualDecision(message.videoId, { watched: message.watched, changedAt: message.changedAt }); break;
      case "AMAGIFLIX_RESET_PROGRESS": await resetVideoProgress(message.videoId); break;
      case "AMAGIFLIX_CLEAR_HISTORY_IMPORT": await clearImported(); break;
      case "AMAGIFLIX_REFRESH_CATALOG": {
        const store = await loadStore();
        const cachedGeneratedAt = store.catalog?.catalogGeneratedAt;
        const announcedCatalogIsNewer = message.catalogGeneratedAt !== undefined
          && (cachedGeneratedAt === undefined || Date.parse(message.catalogGeneratedAt) > Date.parse(cachedGeneratedAt));
        if (announcedCatalogIsNewer) await refreshCatalog(true);
        else await getCatalogVideoIds();
        break;
      }
    }
    await broadcastStates();
    return response(message.requestId, { type: "AMAGIFLIX_ACK" });
  } catch (error) {
    return response(message.requestId, { type: "AMAGIFLIX_ERROR", code: "OPERATION_FAILED", message: error instanceof Error ? error.message : "Extension operation failed." });
  }
}

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "amagiflix-web-bridge" || !APP_URL.test(port.sender?.tab?.url ?? "")) return port.disconnect();
  appPorts.add(port);
  port.onDisconnect.addListener(() => appPorts.delete(port));
  port.onMessage.addListener((message: WebToExtensionMessage) => {
    if (!isWebToExtensionMessage(message)) return;
    void handleWebMessage(message).then((reply) => port.postMessage(reply));
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!sender.tab?.url?.startsWith("https://www.youtube.com/")) return false;
  if (message?.type === "AMAGIFLIX_CHECK_VIDEO" && typeof message.videoId === "string") {
    void isCatalogVideo(message.videoId).then((tracked) => sendResponse({ tracked })).catch(() => sendResponse({ tracked: false }));
    return true;
  }
  if (message?.type === "AMAGIFLIX_TRACKER_CHECKPOINT") {
    const checkpoint = message.checkpoint as TrackerCheckpoint;
    if (!checkpoint || !/^[A-Za-z0-9_-]{11}$/.test(checkpoint.videoId) || typeof checkpoint.started !== "boolean" || typeof checkpoint.completed !== "boolean" || !checkpoint.progress || !Number.isFinite(checkpoint.progress.currentSeconds) || !Number.isFinite(checkpoint.progress.durationSeconds) || checkpoint.progress.durationSeconds <= 0 || !Number.isFinite(Date.parse(checkpoint.progress.measuredAt))) return false;
    void isCatalogVideo(checkpoint?.videoId).then(async (tracked) => {
      if (!tracked) return sendResponse({ saved: false });
      await applyTrackerCheckpoint(checkpoint);
      await broadcastStates();
      sendResponse({ saved: true });
    }).catch(() => sendResponse({ saved: false }));
    return true;
  }
  return false;
});

const navigation = (details: chrome.webNavigation.WebNavigationTransitionCallbackDetails) => {
  if (details.frameId === 0 && details.url.startsWith("https://www.youtube.com/")) void chrome.tabs.sendMessage(details.tabId, { type: "AMAGIFLIX_NAVIGATED", url: details.url }).catch(() => undefined);
};
chrome.webNavigation.onHistoryStateUpdated.addListener(navigation);
chrome.webNavigation.onCommitted.addListener(navigation);
chrome.runtime.onInstalled.addListener(() => { void refreshCatalog(true).catch(() => undefined); });
chrome.runtime.onStartup.addListener(() => { void refreshCatalog().catch(() => undefined); });
