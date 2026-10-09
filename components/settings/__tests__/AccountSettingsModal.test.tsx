// Component tests for account profile and password settings.

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AccountSettingsModal } from "../AccountSettingsModal";

const mock = vi.hoisted(() => ({
  profile: { id: "user-1", username: "old-name", email: "user@example.com", role: "ADMIN" },
  user: { email: "user@example.com" },
  refreshProfile: vi.fn(),
  updateOwnUsernameAction: vi.fn(),
  signInWithPassword: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    profile: mock.profile,
    user: mock.user,
    refreshProfile: mock.refreshProfile,
  }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mock.signInWithPassword,
      updateUser: mock.updateUser,
    },
  }),
}));

vi.mock("@/app/settings/actions", () => ({
  updateOwnUsernameAction: mock.updateOwnUsernameAction,
}));

function renderSettings() {
  return render(<AccountSettingsModal open onOpenChange={vi.fn()} />);
}

beforeEach(() => {
  mock.profile = {
    id: "user-1",
    username: "old-name",
    email: "user@example.com",
    role: "ADMIN",
  };
  mock.refreshProfile.mockReset();
  mock.updateOwnUsernameAction.mockReset().mockResolvedValue({});
  mock.signInWithPassword.mockReset().mockResolvedValue({ error: null });
  mock.updateUser.mockReset().mockResolvedValue({ error: null });
});

afterEach(cleanup);

describe("AccountSettingsModal", () => {
  test("saves a trimmed username through the authenticated profile action", async () => {
    renderSettings();
    const usernameInput = document.querySelector('input[type="text"]');
    expect(usernameInput).not.toBeNull();

    fireEvent.change(usernameInput!, { target: { value: "  new-name  " } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(mock.updateOwnUsernameAction).toHaveBeenCalledWith("new-name");
    });
    expect(mock.refreshProfile).toHaveBeenCalledOnce();
  });

  test("rejects reusing the current password", async () => {
    renderSettings();
    const passwordInputs = document.querySelectorAll('input[type="password"]');

    fireEvent.change(passwordInputs[0], { target: { value: "current-pass" } });
    fireEvent.change(passwordInputs[1], { target: { value: "current-pass" } });
    fireEvent.change(passwordInputs[2], { target: { value: "current-pass" } });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));

    expect(await screen.findByText("New password must differ from current password"))
      .toBeInTheDocument();
    expect(mock.signInWithPassword).not.toHaveBeenCalled();
    expect(mock.updateUser).not.toHaveBeenCalled();
  });

  test("verifies the current password before updating it in Supabase Auth", async () => {
    renderSettings();
    const passwordInputs = document.querySelectorAll('input[type="password"]');

    fireEvent.change(passwordInputs[0], { target: { value: "current-pass" } });
    fireEvent.change(passwordInputs[1], { target: { value: "new-password" } });
    fireEvent.change(passwordInputs[2], { target: { value: "new-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));

    await waitFor(() => {
      expect(mock.signInWithPassword).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "current-pass",
      });
    });
    expect(mock.updateUser).toHaveBeenCalledWith({ password: "new-password" });
    expect(await screen.findByText("Password updated")).toBeInTheDocument();
  });

  test("uses the shared scrollbar with an inset for form controls", () => {
    renderSettings();

    expect(document.querySelector('[data-slot="scroll-area"]'))
      .toBeInTheDocument();
    expect(
      document.querySelector('[data-slot="scroll-area-viewport"] .pr-3')
    ).toBeInTheDocument();
  });
});
