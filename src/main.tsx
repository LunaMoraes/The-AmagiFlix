import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { LibraryProvider } from "./context/LibraryContext";
import { ProfileProvider } from "./context/ProfileContext";
import { ExtensionBridgeProvider } from "./context/ExtensionBridgeContext";
import { HistoryImportProvider } from "./context/HistoryImportContext";
import { ExtendedExperienceProvider } from "./context/ExtendedExperienceContext";
import "./styles/global.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <ExtensionBridgeProvider><HistoryImportProvider><ProfileProvider><ExtendedExperienceProvider><LibraryProvider><App /></LibraryProvider></ExtendedExperienceProvider></ProfileProvider></HistoryImportProvider></ExtensionBridgeProvider>
    </HashRouter>
  </StrictMode>,
);
