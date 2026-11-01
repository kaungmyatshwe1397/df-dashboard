// Scripts must stay in the document head, never directly under html where React rejects them.
import { Children, isValidElement, type ReactElement, type ReactNode } from "react";
import { describe, expect, test, vi } from "vitest";
import Script from "next/script";
import RootLayout from "@/app/layout";
import { DataProvider } from "@/context/DataContext";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "font-body" }),
  Geist_Mono: () => ({ variable: "font-mono" }),
}));

function findDataProvider(node: ReactNode): ReactElement<{ initialMonth: string }> | undefined {
  for (const child of Children.toArray(node)) {
    if (!isValidElement<{ children?: ReactNode; initialMonth: string }>(child)) continue;
    if (child.type === DataProvider) return child;
    const nested = findDataProvider(child.props.children);
    if (nested) return nested;
  }
}

describe("root document structure", () => {
  test("html contains only head and body elements", () => {
    const layout = RootLayout({ children: null });
    const children = Children.toArray(layout.props.children).filter(isValidElement);
    expect(layout.type).toBe("html");
    expect(children.map((child) => child.type)).toEqual(["head", "body"]);
  });

  test("the theme bootstrap stays inside head and runs before hydration", () => {
    const layout = RootLayout({ children: null });
    const children = Children.toArray(layout.props.children).filter(isValidElement);
    const head = children.find((child) => child.type === "head") as ReactElement<{ children: ReactNode }>;
    expect(head).toBeDefined();
    const script = Children.only(head.props.children) as ReactElement<{ src: string; strategy: string }>;
    expect(script.type).toBe(Script);
    expect(script.props.src).toBe("/theme-init.js");
    expect(script.props.strategy).toBe("beforeInteractive");
  });

  test.each([
    ["2026-09-15T12:00:00Z", "Sep 2026"],
    ["2026-09-30T18:00:00Z", "Oct 2026"],
  ])("shares the canonical clinic month for %s", (date, expected) => {
    vi.setSystemTime(new Date(date));
    try {
      const layout = RootLayout({ children: null });
      expect(findDataProvider(layout)?.props.initialMonth).toBe(expected);
    } finally { vi.setSystemTime(new Date("2026-09-15T12:00:00")); }
  });
});
