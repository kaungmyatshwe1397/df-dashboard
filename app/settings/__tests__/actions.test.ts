// Server action tests for authenticated profile updates.

import { beforeEach, describe, expect, test, vi } from "vitest";
import { updateOwnUsernameAction } from "../actions";

const mock = vi.hoisted(() => ({
  getUser: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
  select: vi.fn(),
  maybeSingle: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mock.getUser } }),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      update: mock.update,
    }),
  }),
}));

beforeEach(() => {
  mock.getUser.mockReset().mockResolvedValue({
    data: { user: { id: "signed-in-user" } },
    error: null,
  });
  mock.update.mockReset().mockReturnValue({ eq: mock.eq });
  mock.eq.mockReset().mockReturnValue({ select: mock.select });
  mock.select.mockReset().mockReturnValue({ maybeSingle: mock.maybeSingle });
  mock.maybeSingle.mockReset().mockResolvedValue({
    data: { id: "signed-in-user" },
    error: null,
  });
});

describe("updateOwnUsernameAction", () => {
  test("updates only the authenticated user's username", async () => {
    const result = await updateOwnUsernameAction("new-name");

    expect(result).toEqual({});
    expect(mock.update).toHaveBeenCalledWith({ username: "new-name" });
    expect(mock.eq).toHaveBeenCalledWith("id", "signed-in-user");
  });

  test("rejects unauthenticated requests", async () => {
    mock.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error("No session"),
    });

    const result = await updateOwnUsernameAction("new-name");

    expect(result.error).toBe("Not authenticated");
    expect(mock.update).not.toHaveBeenCalled();
  });
});
