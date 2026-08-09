import { BRIDGE_PROTOCOL_VERSION, EXTENSION_BRIDGE_CHANNEL, isExtensionToWebMessage, WEB_BRIDGE_CHANNEL, type ExtensionToWebMessage, type WebToExtensionInput, type WebToExtensionMessage } from "../../shared/bridge-protocol";

export function sendBridgeRequest(input: WebToExtensionInput, timeoutMs = 900, signal?: AbortSignal): Promise<ExtensionToWebMessage> {
  const requestId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  const request = { ...input, protocolVersion: BRIDGE_PROTOCOL_VERSION, requestId } as WebToExtensionMessage;
  return new Promise((resolve, reject) => {
    const targetWindow = window;
    const timer = targetWindow.setTimeout(() => { cleanup(); reject(new Error("Companion extension did not respond.")); }, timeoutMs);
    const onMessage = (event: MessageEvent) => {
      if (event.source !== targetWindow || event.origin !== targetWindow.location.origin || event.data?.channel !== EXTENSION_BRIDGE_CHANNEL) return;
      const message = event.data.message;
      if (!isExtensionToWebMessage(message) || !("requestId" in message) || message.requestId !== requestId) return;
      cleanup(); resolve(message);
    };
    const onAbort = () => { cleanup(); reject(new DOMException("Bridge request aborted.", "AbortError")); };
    const cleanup = () => { targetWindow.clearTimeout(timer); targetWindow.removeEventListener("message", onMessage); signal?.removeEventListener("abort", onAbort); };
    if (signal?.aborted) return onAbort();
    signal?.addEventListener("abort", onAbort, { once: true });
    targetWindow.addEventListener("message", onMessage);
    targetWindow.postMessage({ channel: WEB_BRIDGE_CHANNEL, message: request }, targetWindow.location.origin);
  });
}

export function subscribeBridgeEvents(listener: (states: import("../types/library").ExtensionVideoState[]) => void) {
  const onMessage = (event: MessageEvent) => {
    if (event.source !== window || event.origin !== window.location.origin || event.data?.channel !== EXTENSION_BRIDGE_CHANNEL) return;
    const message = event.data.message;
    if (isExtensionToWebMessage(message) && message.type === "AMAGIFLIX_STATE_CHANGED") listener(message.states);
  };
  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}
