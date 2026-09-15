// ============================================
// Component Tests — RecordTableHelpers
// ============================================
// Tests for TableEmpty, TableError, TableSkeleton, and TablePagination components.
// Each test scopes queries to its own container to avoid JSDOM portal leaks.

import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import {
  TableEmpty,
  TableError,
  TableSkeleton,
  TablePagination,
} from "./RecordTableHelpers";

describe("TableEmpty", () => {
  test("renders message and add button when not locked", () => {
    const onAdd = vi.fn();
    const { container } = render(
      <TableEmpty
        message="No GP records yet this cycle."
        onAdd={onAdd}
        cycleLocked={false}
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(within(wrapper).getByText("No GP records yet this cycle.")).toBeInTheDocument();
    const addBtn = within(wrapper).getByText("Add Record");
    expect(addBtn).toBeInTheDocument();

    fireEvent.click(addBtn);
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  test("hides add button when cycle is locked", () => {
    const { container } = render(
      <TableEmpty
        message="No case records yet this cycle."
        onAdd={() => {}}
        cycleLocked={true}
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(within(wrapper).getByText("No case records yet this cycle.")).toBeInTheDocument();
    expect(within(wrapper).queryByText("Add Record")).not.toBeInTheDocument();
  });
});

describe("TableError", () => {
  test("renders error message and retry button", () => {
    const onRetry = vi.fn();
    const { container } = render(<TableError onRetry={onRetry} />);

    const wrapper = container.firstChild as HTMLElement;
    expect(
      within(wrapper).getByText("Failed to load records. Please try again.")
    ).toBeInTheDocument();

    const retryBtn = within(wrapper).getByText("Retry");
    expect(retryBtn).toBeInTheDocument();

    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe("TableSkeleton", () => {
  test("renders without crashing", () => {
    const { container } = render(<TableSkeleton columns={5} />);
    expect(container).toBeTruthy();
  });
});

describe("TablePagination", () => {
  test("renders page links when totalPages > 1", () => {
    const { container } = render(
      <TablePagination
        currentPage={1}
        totalPages={3}
        onPageChange={() => {}}
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(within(wrapper).getByText("1")).toBeInTheDocument();
    expect(within(wrapper).getByText("2")).toBeInTheDocument();
    expect(within(wrapper).getByText("3")).toBeInTheDocument();
  });

  test("returns null when totalPages <= 1", () => {
    const { container } = render(
      <TablePagination
        currentPage={1}
        totalPages={1}
        onPageChange={() => {}}
      />
    );

    expect(container.innerHTML).toBe("");
  });

  test("calls onPageChange when clicking a page link", () => {
    const onPageChange = vi.fn();
    const { container } = render(
      <TablePagination
        currentPage={1}
        totalPages={3}
        onPageChange={onPageChange}
      />
    );

    const wrapper = container.firstChild as HTMLElement;
    const pageLink = within(wrapper).getByText("2");
    fireEvent.click(pageLink);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
