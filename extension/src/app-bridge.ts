import { EXTENSION_BRIDGE_CHANNEL, isExtensionToWebMessage, isWebToExtensionMessage, WEB_BRIDGE_CHANNEL } from "../../shared/bridge-protocol";

const port = chrome.runtime.connect({ name: "amagiflix-web-bridge" });

window.addEventListener("message", (event) => {
  if (event.source !== window || event.origin !== window.location.origin || event.data?.channel !== WEB_BRIDGE_CHANNEL) return;
  if (isWebToExtensionMessage(event.data.message)) port.postMessage(event.data.message);
});

port.onMessage.addListener((message) => {
  if (!isExtensionToWebMessage(message)) return;
  window.postMessage({ channel: EXTENSION_BRIDGE_CHANNEL, message }, window.location.origin);
});
