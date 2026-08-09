import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";

if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
}

if (!HTMLDialogElement.prototype.close) {
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
}

Object.defineProperty(HTMLElement.prototype, "scrollBy", {
  configurable: true,
  value: () => undefined,
});

beforeEach(() => {
  localStorage.clear();
  window.location.hash = "#/";
});

afterEach(() => cleanup());
