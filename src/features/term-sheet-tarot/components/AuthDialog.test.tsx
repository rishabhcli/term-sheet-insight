import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { clearSupabaseSession, mockSupabase } from "@/test/mocks/supabase";
import { renderWithProviders } from "@/test/test-utils";

import { AuthDialog } from "./AuthDialog";

describe("AuthDialog", () => {
  beforeEach(() => {
    clearSupabaseSession();
  });

  it("signs in existing users and closes on success", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(<AuthDialog open onClose={onClose} />);

    await user.type(screen.getByLabelText("Email"), "ceo@example.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => {
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "ceo@example.com",
        password: "secret123",
      });
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("shows a success message after sign-up", async () => {
    const user = userEvent.setup();

    renderWithProviders(<AuthDialog open onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Don't have an account? Sign up" }));
    await user.type(screen.getByLabelText("Email"), "new@example.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() => {
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: "new@example.com",
        password: "secret123",
        options: { emailRedirectTo: window.location.origin },
      });
    });
    expect(screen.getByText("✓ Check your email for a confirmation link.")).toBeInTheDocument();
  });

  it("renders authentication errors", async () => {
    const user = userEvent.setup();
    mockSupabase.auth.signInWithPassword.mockResolvedValueOnce({
      data: { session: null, user: null },
      error: { message: "Invalid credentials" },
    });

    renderWithProviders(<AuthDialog open onClose={vi.fn()} />);

    await user.type(screen.getByLabelText("Email"), "ceo@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong-pass");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
  });
});
