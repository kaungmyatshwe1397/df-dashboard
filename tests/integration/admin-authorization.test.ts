// Protect privileged user-management actions from non-admin callers.

import { beforeEach, describe, expect, test, vi } from "vitest";
import { deleteUserAction, updateUserRoleAction } from "@/app/admin/actions";
import { UserRole } from "@/lib/global";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  profile: vi.fn(),
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: mocks.getUser },
    from: () => ({
      select: () => ({
        eq: () => ({ single: mocks.profile }),
      }),
    }),
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mocks.createAdminClient,
}));

beforeEach(() => {
  mocks.getUser.mockReset();
  mocks.profile.mockReset();
  mocks.createAdminClient.mockReset();
});

describe("admin action authorization", () => {
  test("rejects unauthenticated callers before service-role access", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null }, error: new Error("No session") });

    await expect(deleteUserAction("target-user")).rejects.toThrow("Unauthorized");
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
  });

  test.each([UserRole.ASSISTANT, UserRole.SUPERVISOR])(
    "rejects %s callers before service-role access",
    async (role) => {
      mocks.getUser.mockResolvedValue({
        data: { user: { id: "caller-user" } },
        error: null,
      });
      mocks.profile.mockResolvedValue({ data: { role }, error: null });

      await expect(
        updateUserRoleAction("target-user", UserRole.ASSISTANT)
      ).rejects.toThrow("Unauthorized");
      expect(mocks.createAdminClient).not.toHaveBeenCalled();
    }
  );
});
