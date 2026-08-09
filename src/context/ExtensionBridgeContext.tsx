import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { EXTENSION_VERSION } from "../config/app";
import { sendBridgeRequest, subscribeBridgeEvents } from "../extension-bridge/client";
import type { ExtensionVideoState, ImportedWatchState, ManualWatchDecision } from "../types/library";

type BridgeStatus = "checking" | "connected" | "missing";

interface ExtensionBridgeValue {
  status: BridgeStatus;
  extensionVersion?: string;
  updateAvailable: boolean;
  states: ExtensionVideoState[];
  retry(): void;
  importHistory(records: ImportedWatchState[]): Promise<void>;
  setManualWatched(videoId: string, decision: ManualWatchDecision): Promise<void>;
  resetProgress(videoId: string): Promise<void>;
  clearImportedHistory(): Promise<void>;
  refreshCatalog(generatedAt?: string): Promise<void>;
}

const ExtensionBridgeContext = createContext<ExtensionBridgeValue | null>(null);

export function ExtensionBridgeProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<BridgeStatus>("checking");
  const [extensionVersion, setExtensionVersion] = useState<string>();
  const [states, setStates] = useState<ExtensionVideoState[]>([]);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => subscribeBridgeEvents(setStates), []);
  useEffect(() => {
    let active = true;
    setStatus("checking");
    sendBridgeRequest({ type: "AMAGIFLIX_PING" })
      .then(async (response) => {
        if (!active || response.type !== "AMAGIFLIX_PONG") return;
        setExtensionVersion(response.extensionVersion);
        setStatus("connected");
        const stateResponse = await sendBridgeRequest({ type: "AMAGIFLIX_GET_STATES" }, 2_000);
        if (active && stateResponse.type === "AMAGIFLIX_STATES") setStates(stateResponse.states);
      })
      .catch(() => { if (active) setStatus("missing"); });
    return () => { active = false; };
  }, [attempt]);

  const ack = useCallback(async (input: Parameters<typeof sendBridgeRequest>[0]) => {
    if (status !== "connected") return;
    const response = await sendBridgeRequest(input, 2_000);
    if (response.type === "AMAGIFLIX_ERROR") throw new Error(response.message);
  }, [status]);

  const value = useMemo<ExtensionBridgeValue>(() => ({
    status,
    extensionVersion,
    updateAvailable: status === "connected" && extensionVersion !== EXTENSION_VERSION,
    states,
    retry: () => setAttempt((value) => value + 1),
    importHistory: (records) => ack({ type: "AMAGIFLIX_IMPORT_HISTORY", records }),
    setManualWatched: (videoId, decision) => ack({ type: "AMAGIFLIX_SET_MANUAL_WATCHED", videoId, watched: decision.watched, changedAt: decision.changedAt }),
    resetProgress: (videoId) => ack({ type: "AMAGIFLIX_RESET_PROGRESS", videoId }),
    clearImportedHistory: () => ack({ type: "AMAGIFLIX_CLEAR_HISTORY_IMPORT" }),
    refreshCatalog: (catalogGeneratedAt) => ack({ type: "AMAGIFLIX_REFRESH_CATALOG", catalogGeneratedAt }),
  }), [ack, extensionVersion, states, status]);
  return <ExtensionBridgeContext.Provider value={value}>{children}</ExtensionBridgeContext.Provider>;
}

export function useExtensionBridge() {
  const value = useContext(ExtensionBridgeContext);
  if (!value) throw new Error("useExtensionBridge must be used inside ExtensionBridgeProvider.");
  return value;
}
