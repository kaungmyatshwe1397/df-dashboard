// Visual viewport changes reveal the space available above a mobile keyboard without changing dialog state.

import { useSyncExternalStore, type CSSProperties } from "react";

function subscribe(callback: () => void) {
  const viewport = window.visualViewport;
  viewport?.addEventListener("resize", callback);
  viewport?.addEventListener("scroll", callback);
  return () => {
    viewport?.removeEventListener("resize", callback);
    viewport?.removeEventListener("scroll", callback);
  };
}

function getSnapshot() {
  const viewport = window.visualViewport;
  return viewport ? `${viewport.height}:${viewport.offsetTop}` : "";
}

function getServerSnapshot() { return ""; }

type DialogViewportStyleType = CSSProperties & {
  "--dialog-visible-height"?: string;
  "--dialog-visible-top"?: string;
};

export function useDialogViewport(): DialogViewportStyleType {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!snapshot) return {};
  const [height, top] = snapshot.split(":");
  return { "--dialog-visible-height": `${height}px`, "--dialog-visible-top": `${top}px` };
}
