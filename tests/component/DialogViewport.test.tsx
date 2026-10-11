// Dialog sizing follows the visible viewport when a mobile keyboard reduces available space.

import { afterEach, expect, test, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useDialogViewport } from "@/hooks/use-dialog-viewport";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

test("updates dialog viewport styles and unsubscribes on unmount", () => {
  const viewport = Object.assign(new EventTarget(), { height: 700, offsetTop: 0 });
  const removeListener = vi.spyOn(viewport, "removeEventListener");
  vi.stubGlobal("visualViewport", viewport);
  const { result, unmount } = renderHook(() => useDialogViewport());
  expect(result.current["--dialog-visible-height"]).toBe("700px");
  act(() => {
    viewport.height = 350;
    viewport.offsetTop = 30;
    viewport.dispatchEvent(new Event("resize"));
  });
  expect(result.current["--dialog-visible-height"]).toBe("350px");
  expect(result.current["--dialog-visible-top"]).toBe("30px");
  unmount();
  expect(removeListener).toHaveBeenCalledWith("resize", expect.any(Function));
});
