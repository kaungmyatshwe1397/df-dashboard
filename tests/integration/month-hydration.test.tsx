// A saved browser month must not change the first render that hydrates server HTML.
import { act, cleanup, waitFor } from "@testing-library/react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { DataProvider, useData } from "@/context/DataContext";

function MonthLabel() {
  return <span>{useData().selectedMonth}</span>;
}

let root: Root | undefined;
let container: HTMLDivElement | undefined;
beforeEach(() => {
  vi.setSystemTime(new Date("2026-11-01T12:00:00"));
  localStorage.setItem("lastSelectedMonth", "Sep 2026");
});
afterEach(async () => {
  if (root) await act(async () => root?.unmount());
  root = undefined; container?.remove(); container = undefined;
  localStorage.removeItem("lastSelectedMonth"); cleanup();
  vi.setSystemTime(new Date("2026-09-15T12:00:00"));
});

test("server render ignores a saved browser month", () => {
  const html = renderToString(<DataProvider><MonthLabel /></DataProvider>);
  expect(html).toContain("Nov 2026");
  expect(html).not.toContain("Sep 2026");
});

test("restores a saved month after hydration without rebuilding the server tree", async () => {
  const tree = <DataProvider><MonthLabel /></DataProvider>;
  container = document.createElement("div");
  const storage = vi.spyOn(Storage.prototype, "getItem").mockReturnValue(null);
  container.innerHTML = renderToString(tree);
  storage.mockRestore();
  document.body.appendChild(container);
  const errors = vi.fn();
  await act(async () => { root = hydrateRoot(container!, tree, { onRecoverableError: errors }); });
  await waitFor(() => expect(container?.textContent).toBe("Sep 2026"));
  expect(errors).not.toHaveBeenCalled();
});

test("hydrates the server month even when the browser clock crosses a month boundary", async () => {
  localStorage.removeItem("lastSelectedMonth");
  const tree = <DataProvider initialMonth="Nov 2026"><MonthLabel /></DataProvider>;
  container = document.createElement("div");
  container.innerHTML = renderToString(tree);
  document.body.appendChild(container);
  vi.setSystemTime(new Date("2026-12-01T12:00:00"));
  const errors = vi.fn();
  await act(async () => { root = hydrateRoot(container!, tree, { onRecoverableError: errors }); });
  expect(container.textContent).toBe("Nov 2026");
  expect(errors).not.toHaveBeenCalled();
});

test("blocked local storage does not prevent month selection", async () => {
  const { render, fireEvent, screen } = await import("@testing-library/react");
  function MonthChoice() {
    const data = useData();
    return <button onClick={() => data.setSelectedMonth("Aug 2026")}>{data.selectedMonth}</button>;
  }
  const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("Blocked storage"); });
  const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Blocked storage"); });
  try {
    render(<DataProvider><MonthChoice /></DataProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Nov 2026" }));
    expect(screen.getByRole("button", { name: "Aug 2026" })).toBeInTheDocument();
  } finally { getItem.mockRestore(); setItem.mockRestore(); }
});
